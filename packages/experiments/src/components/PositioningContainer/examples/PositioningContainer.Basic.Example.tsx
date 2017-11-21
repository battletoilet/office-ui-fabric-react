import * as React from 'react';
import { PositioningContainer } from '../PositioningContainer';
import { DefaultButton } from 'office-ui-fabric-react/lib/Button';

export interface IPositioningContainerBasicExampleState {
  isPositioningContainerVisible?: boolean;
}

export class PositioningContainerBasicExample extends React.Component<{}, IPositioningContainerBasicExampleState> {
  public constructor() {
    super();

    this._onShowMenuClicked = this._onShowMenuClicked.bind(this);
    this._onDismiss = this._onDismiss.bind(this);

    this.state = {
      isPositioningContainerVisible: false
    }
  }
  public render(): JSX.Element {
    let { isPositioningContainerVisible } = this.state;
    return (
      <div>
        <div className='ms-PositioningContainerBasicExample-buttonArea'>
          <DefaultButton
            onClick={ this._onShowMenuClicked }
            text={ isPositioningContainerVisible ? 'Hide Positioning Container' : 'Show Positioning Container' }
            className={ 'ms-PositioningContainer-basicExampleButton' }
          />
        </div>
        { isPositioningContainerVisible && (
          <PositioningContainer
            className='ms-PositioningContainer'
            role={ 'alertdialog' }
            target={ '.ms-PositioningContainer-basicExampleButton' }
            onDismiss={ this._onDismiss }
            setInitialFocus={ true }
          >
            <h1>An H1 element</h1>
          </PositioningContainer>
        ) }
      </div>
    );
  }
  private _onShowMenuClicked() {
    this.setState({
      isPositioningContainerVisible: !this.state.isPositioningContainerVisible
    });
  }

  private _onDismiss() {
    this.setState({
      isPositioningContainerVisible: false
    });
  }
}