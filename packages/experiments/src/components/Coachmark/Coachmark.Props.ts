import * as React from 'react';
import { Coachmark } from './Coachmark';
import { ICoachmarkStyles, ICoachmarkStyleProps } from './Coachmark.Styles';
import { IStyleFunction } from '../../Utilities';

export interface ICoachmark {
}

export interface ICoachmarkProps extends React.Props<Coachmark> {
  /**
  * All props for your component are to be defined here.
  */
  componentRef?: (component: ICoachmark) => void;

  /**
   * Called when the teaching bubble has been expanded.
   */
  onExpandComplete?: () => void;

  /**
   * Get styles method
   */
  getStyles?: IStyleFunction<ICoachmarkStyleProps, ICoachmarkStyles>;
}
