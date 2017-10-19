import * as React from 'react';
import { Coachmark } from './Coachmark';
import { IRenderFunction } from '../../Utilities';
import { ITeachingBubbleProps } from '../TeachingBubble/TeachingBubble.Props';

export interface ICoachmark {

}
export interface ICoachmarkStyles {

}
export interface ICoachmarkProps extends React.Props<Coachmark> {
  /**
  * All props for your component are to be defined here.
  */
  componentRef?: (component: ICoachmark) => void;

  /**
   * Teaching Bubble onRender override.
   */
  onRenderTeachingBubble: IRenderFunction<ITeachingBubbleProps>;
}