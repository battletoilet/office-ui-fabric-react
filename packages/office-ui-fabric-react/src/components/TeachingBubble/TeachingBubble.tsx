/* tslint:disable:no-unused-variable */
import * as React from 'react';
/* tslint:enable:no-unused-variable */
import { BaseComponent, css } from '../../Utilities';
import { TeachingBubbleContent } from './TeachingBubbleContent';
import { ITeachingBubbleProps } from './TeachingBubble.Props';
import { Callout } from '../../Callout';
import { DirectionalHint } from '../../common/DirectionalHint';
import * as stylesImport from './TeachingBubble.scss';
const styles: any = stylesImport;

export interface ITeachingBubbleState {
  isTeachingBubbleVisible?: boolean;
  isCoachmarkAnimating?: boolean;
  isCoachmarkWiggling?: boolean;
}

export class TeachingBubble extends BaseComponent<ITeachingBubbleProps, ITeachingBubbleState> {

  // Specify default props values
  public static defaultProps = {
    calloutProps: {
      beakWidth: 16,
      gapSpace: 0,
      setInitialFocus: true,
      doNotLayer: false,
      directionalHint: DirectionalHint.rightCenter
    }
  };

  private _currentHeight: number;
  private _currentWidth: number;
  private _coachmark: HTMLDivElement;

  // Constructor
  constructor(props: ITeachingBubbleProps) {
    super(props);

    this.state = {
      isCoachmarkAnimating: false,
      isCoachmarkWiggling: props.isCoachmark // If it's not a Coachmark then we dont want to start animating the TeachingBubble right away
    };
  }

  public componentDidMount() {
    const rect = this._coachmark.getBoundingClientRect();
    const height = rect.height;
    const width = rect.width;
  }

  public render() {
    let { calloutProps, targetElement, isCoachmark } = this.props;
    const classes = css(
      'ms-TeachingBubble',
      styles.root,
      {
        ['ms-TeachingBubble--coachmark']: isCoachmark
      }
    );
    return (
      <Callout
        className={ classes }
        targetElement={ targetElement }
        ref={ this._resolveRef('_callout') }
        parentClassName={ css({
          [styles.coachmarkCalloutContainer]: isCoachmark,
          [styles.coachmarkIsWiggling]: this.state.isCoachmarkWiggling,
          [styles.coachmarkIsAnimating]: this.state.isCoachmarkAnimating
        }) }
        {...calloutProps}
      >
        <div className={ css({ [styles.animationLayer]: isCoachmark, ['TeachingBubble-animationLayer']: isCoachmark }) }
          onClick={ () => {
            this.setState({
              isCoachmarkAnimating: true,
              isCoachmarkWiggling: false
            });
          } } ref={ this._resolveRef('_coachmark') }>
          <TeachingBubbleContent { ...this.props } />
        </div>
      </Callout>
    );
  }

  private _coachmarkOnClickHandler() {

    // Set the height and width of the element

  }
}