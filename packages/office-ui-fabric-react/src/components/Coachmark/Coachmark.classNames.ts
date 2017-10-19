import { memoizeFunction } from '../../Utilities';
import { mergeStyleSets } from '../../Styling';
import { ICoachmarkStyles } from './Coachmark.Props';

export interface ICoachmarkClassNames {
  /**
   * Root html container for this component.
   */
  root?: string;
}

export const getClassNames = memoizeFunction((): ICoachmarkClassNames => {
  return mergeStyleSets({
    root: []
  });
});
