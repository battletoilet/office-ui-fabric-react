import * as React from 'react';
import {
  IDynamicallyPositionedContainerProps
} from './DynamicallyPositionedContainer.Props';
import { getClassNames } from './DynamicallyPositionedContainer.classNames';
import { Layer } from 'office-ui-fabric-react/lib/Layer';

// Utilites/Helpers
import { DirectionalHint } from 'office-ui-fabric-react/lib/common/DirectionalHint';
import {
  BaseComponent,
  IPoint,
  IRectangle,
  assign,
  autobind,
  css,
  elementContains,
  focusFirstChild,
  getWindow,
  getDocument
} from '../../Utilities';
import { getRelativePositions, IPositionInfo, IPositionProps, getMaxHeight, ICalloutPositon } from 'office-ui-fabric-react/lib/utilities/positioning';
import { AnimationClassNames, mergeStyles } from '../../Styling';

const OFF_SCREEN_STYLE = { opacity: 0 };

// In order for some of the max height logic to work
// properly we need to set the border needs to be set.
// The value is abitrary.
const BORDER_WIDTH: number = 1;

export interface IDynamicallyPositionedContainerState {
  /**
   * Current set of calcualted positions for the outermost parent container.
   */
  positions?: IPositionInfo;

  /**
   * Tracks the current height offset and updates during
   * the height animation when props.finalHeight is specified.
   */
  heightOffset?: number;
}

export class DynamicallyPositionedContainer extends BaseComponent<IDynamicallyPositionedContainerProps, IDynamicallyPositionedContainerState> {

  public static defaultProps = {
    preventDismissOnScroll: false,
    offsetFromTarget: 0,
    minPagePadding: 8,
    directionalHint: DirectionalHint.bottomAutoEdge
  };

  private _didSetInitialFocus: boolean;

  /**
   * The primary positioned div.
   */
  private _positionedHost: HTMLDivElement;

  // @TODO rename to reflect the name of this class
  private _contentHost: HTMLDivElement;

  /**
   * Stores an instance of Window, used to check
   * for server side rendering and if focus was lost.
   */
  private _targetWindow: Window;

  /**
   * The bounds used when determing if and where the
   * DynamicallyPositionedContainer should be placed.
   */
  private _positioningBounds: IRectangle;

  /**
   * The maximum height the DynamicallyPositionedContainer can grow to
   * without going being the window or target bounds
   */
  private _maxHeight: number | undefined;
  private _positionAttempts: number;
  private _target: HTMLElement | MouseEvent | IPoint | null;
  private _setHeightOffsetTimer: number;

  constructor(props: IDynamicallyPositionedContainerProps) {
    super(props);
    this._didSetInitialFocus = false;
    this.state = {
      positions: undefined,
      heightOffset: 0
    };
    this._positionAttempts = 0;
  }

  public componentWillMount() {
    this._setTargetWindowAndElement(this._getTarget());
  }

  public componentDidMount() {
    this._onComponentDidMount();
  }

  public componentDidUpdate() {
    this._setInitialFocus();
    this._updateAsyncPosition();
  }

  public componentWillUpdate(newProps: IDynamicallyPositionedContainerProps) {
    // If the target element changed, find the new one. If we are tracking
    // target with class name, always find element because we do not know if
    // fabric has rendered a new element and disposed the old element.
    let newTarget = this._getTarget(newProps);
    let oldTarget = this._getTarget();
    if (newTarget !== oldTarget || typeof (newTarget) === 'string' || newTarget instanceof String) {
      this._maxHeight = undefined;
      this._setTargetWindowAndElement(newTarget!);
    }

    if (newProps.offsetFromTarget !== this.props.offsetFromTarget) {
      this._maxHeight = undefined;
    }

    if (newProps.finalHeight !== this.props.finalHeight) {
      this._setHeightOffsetEveryFrame();
    }
  }

  public render() {
    // If there is no target window then we are likely in server side rendering and we should not render anything.
    if (!this._targetWindow) {
      return null;
    }

    let {
      className,
      calloutWidth,
      calloutMaxHeight,
      children } = this.props;
    let { positions } = this.state;

    const styles: any = getClassNames();

    let directionalClassName = (positions && positions.directionalClassName)
      ? (AnimationClassNames as any)[positions.directionalClassName]
      : '';

    let getContentMaxHeight: number = this._getMaxHeight() + this.state.heightOffset!;
    let contentMaxHeight: number = calloutMaxHeight! && (calloutMaxHeight! > getContentMaxHeight) ? getContentMaxHeight : calloutMaxHeight!;

    let content = (

      <div
        ref={ this._resolveRef('_positionedHost') }
        className={ css('ms-DynamicallyPositionedContainer', styles.container) }
      >
        <div
          className={
            mergeStyles(
              'ms-DynamicallyPositionedContainer-layerHost',
              styles.root,
              className,
              directionalClassName,
              !!calloutWidth && { width: calloutWidth }
            ) }
          style={ positions ? positions.calloutPosition : OFF_SCREEN_STYLE }
          tabIndex={ -1 } // Safari and Firefox on Mac OS requires this to back-stop click events so focus remains in the Callout.
          // See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
          ref={ this._resolveRef('_contentHost') }
        >
          { children }
          { // @TODO apply  to the content container
            contentMaxHeight
          }
        </div>
      </div>
    );

    return this.props.doNotLayer ? content : (
      <Layer>
        { content }
      </Layer>
    );
  }

  @autobind
  public dismiss(ev?: Event | React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) {
    let { onDismiss } = this.props;

    if (onDismiss) {
      onDismiss(ev);
    }
  }

  protected _dismissOnScroll(ev: Event) {
    const { preventDismissOnScroll } = this.props;
    if (this.state.positions && !preventDismissOnScroll) {
      this._dismissOnLostFocus(ev);
    }
  }

  protected _dismissOnLostFocus(ev: Event) {
    let target = ev.target as HTMLElement;
    let clickedOutsideCallout = this._positionedHost && !elementContains(this._positionedHost, target);

    if (
      (!this._target && clickedOutsideCallout) ||
      ev.target !== this._targetWindow &&
      clickedOutsideCallout &&
      ((this._target as MouseEvent).stopPropagation ||
        (!this._target || (target !== this._target && !elementContains(this._target as HTMLElement, target))))) {
      this.dismiss(ev);
    }
  }

  @autobind
  protected _setInitialFocus() {
    if (this.props.setInitialFocus && !this._didSetInitialFocus && this.state.positions) {
      this._didSetInitialFocus = true;
      focusFirstChild(this._contentHost);
    }
  }

  @autobind
  protected _onComponentDidMount() {
    // This is added so the callout will dismiss when the window is scrolled
    // but not when something inside the callout is scrolled. The delay seems
    // to be required to avoid React firing an async focus event in IE from
    // the target changing focus quickly prior to rendering the callout.
    this._async.setTimeout(() => {
      this._events.on(this._targetWindow, 'scroll', this._dismissOnScroll, true);
      this._events.on(this._targetWindow, 'resize', this.dismiss, true);
      this._events.on(this._targetWindow.document.body, 'focus', this._dismissOnLostFocus, true);
      this._events.on(this._targetWindow.document.body, 'click', this._dismissOnLostFocus, true);
    }, 0);

    if (this.props.onLayerMounted) {
      this.props.onLayerMounted();
    }

    this._updateAsyncPosition();
    this._setHeightOffsetEveryFrame();
  }

  private _updateAsyncPosition() {
    this._async.requestAnimationFrame(() => this._updatePosition());
  }

  private _updatePosition() {
    let { positions } = this.state;
    let hostElement: HTMLElement = this._positionedHost;
    let calloutElement: HTMLElement = this._contentHost;

    if (hostElement && calloutElement) {
      let currentProps: IPositionProps | undefined;
      currentProps = assign(currentProps, this.props);
      currentProps!.bounds = this._getBounds();
      currentProps!.target = this._target!;
      let newPositions: IPositionInfo = getRelativePositions(currentProps!, hostElement, calloutElement);

      // Set the new position only when the positions are not exists or one of the new callout positions are different.
      // The position should not change if the position is within 2 decimal places.
      if ((!positions && newPositions) ||
        (positions && newPositions && !this._arePositionsEqual(positions, newPositions)
          && this._positionAttempts < 5)) {
        // We should not reposition the callout more than a few times, if it is then the content is likely resizing
        // and we should stop trying to reposition to prevent a stack overflow.
        this._positionAttempts++;
        this.setState({
          positions: newPositions
        });
      } else {
        this._positionAttempts = 0;
        if (this.props.onPositioned) {
          this.props.onPositioned();
        }
      }
    }
  }

  private _getBounds(): IRectangle {
    if (!this._positioningBounds) {
      let currentBounds = this.props.bounds;

      if (!currentBounds) {
        currentBounds = {
          top: 0 + this.props.minPagePadding!,
          left: 0 + this.props.minPagePadding!,
          right: this._targetWindow.innerWidth - this.props.minPagePadding!,
          bottom: this._targetWindow.innerHeight - this.props.minPagePadding!,
          width: this._targetWindow.innerWidth - this.props.minPagePadding! * 2,
          height: this._targetWindow.innerHeight - this.props.minPagePadding! * 2
        };
      }
      this._positioningBounds = currentBounds;
    }
    return this._positioningBounds;
  }

  /**
   * Return the maximum height the container can grow to
   * without going out of the specified bounds
   */
  private _getMaxHeight(): number {
    //If the max height is undefined.
    if (!this._maxHeight) {
      // if the directional hint is fixed and our target Exists
      if (this.props.directionalHintFixed && this._target) {
        this._maxHeight = getMaxHeight(this._target, this.props.directionalHint!, this.props.offsetFromTarget, this._getBounds());
      } else {
        this._maxHeight = this._getBounds().height! - BORDER_WIDTH * 2;
      }
    }
    return this._maxHeight!;
  }

  private _arePositionsEqual(positions: IPositionInfo, newPosition: IPositionInfo) {
    return this._comparePositions(positions.calloutPosition, newPosition.calloutPosition);
  }

  private _comparePositions(oldPositions: ICalloutPositon, newPositions: ICalloutPositon) {
    for (const key in newPositions) {
      // This needs to be checked here and below because there is a linting error if for in does not immediately have an if statement
      if (newPositions.hasOwnProperty(key)) {
        const oldPositionEdge = oldPositions[key];
        const newPositionEdge = newPositions[key];

        if (oldPositionEdge && newPositionEdge) {
          if (oldPositionEdge.toFixed(2) !== newPositionEdge.toFixed(2)) {
            return false;
          }
        }
      }
    }
    return true;
  }

  private _setTargetWindowAndElement(target: HTMLElement | string | MouseEvent | IPoint | null): void {
    if (target) {
      if (typeof target === 'string') {
        let currentDoc: Document = getDocument()!;
        this._target = currentDoc ? currentDoc.querySelector(target) as HTMLElement : null;
        this._targetWindow = getWindow()!;
      } else if ((target as MouseEvent).stopPropagation) {
        this._targetWindow = getWindow((target as MouseEvent).toElement as HTMLElement)!;
        this._target = target;
      } else if ((target as IPoint).x !== undefined && (target as IPoint).y !== undefined) {
        this._targetWindow = getWindow()!;
        this._target = target;
      } else {
        let targetElement: HTMLElement = target as HTMLElement;
        this._targetWindow = getWindow(targetElement)!;
        this._target = target;
      }
    } else {
      this._targetWindow = getWindow()!;
    }
  }

  /**
   * Animates the height if finalHeight was given.
   */
  private _setHeightOffsetEveryFrame(): void {
    if (this._contentHost && this.props.finalHeight) {
      this._setHeightOffsetTimer = this._async.requestAnimationFrame(() => {
        const calloutMainElem = this._contentHost.lastChild as HTMLElement;
        const cardScrollHeight: number = calloutMainElem.scrollHeight;
        const cardCurrHeight: number = calloutMainElem.offsetHeight;
        const scrollDiff: number = cardScrollHeight - cardCurrHeight;

        this.setState({
          heightOffset: this.state.heightOffset! + scrollDiff
        });

        if (calloutMainElem.offsetHeight < this.props.finalHeight!) {
          this._setHeightOffsetEveryFrame();
        } else {
          this._async.cancelAnimationFrame(this._setHeightOffsetTimer);
        }
      });
    }
  }

  private _getTarget(props: IDynamicallyPositionedContainerProps = this.props): HTMLElement | string | MouseEvent | IPoint | null {
    let { useTargetPoint, targetPoint, target } = props;
    return useTargetPoint ? targetPoint! : target!;
  }
};