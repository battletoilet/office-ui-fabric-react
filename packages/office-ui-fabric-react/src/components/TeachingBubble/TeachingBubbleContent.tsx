/* tslint:disable:no-unused-variable */
import * as React from 'react';
/* tslint:enable:no-unused-variable */
import {
  BaseComponent,
  css,
  getId
} from '../../Utilities';
import { ITeachingBubbleProps } from './TeachingBubble.Props';
import { ITeachingBubbleState } from './TeachingBubble';
import { PrimaryButton, DefaultButton, IconButton } from '../../Button';
import { Image, ImageFit } from '../../Image';
import { Icon, IconName } from '../../Icon';
import * as stylesImport from './TeachingBubble.scss';
const styles: any = stylesImport;

export interface ITeachingBubbleClassNames {
  base?: string;
  variant?: string;
}

export class TeachingBubbleContent extends BaseComponent<ITeachingBubbleProps, ITeachingBubbleState> {

  // Specify default props values
  public static defaultProps = {
    hasCondensedHeadline: false,
    imageProps: {
      imageFit: ImageFit.cover,
      width: 364,
      height: 130
    },
    classNames: {
      base: 'ms-TeachingBubble',
      variant: ''
    }
  };

  // Specify any private variables
  private _id: string;

  // Constructor
  constructor(props: ITeachingBubbleProps) {
    super(props);

    this._id = getId('TeachingBubble');
    this.state = {
    };
  }

  public render() {
    let { illustrationImage, primaryButtonProps, secondaryButtonProps, headline, hasCondensedHeadline, hasCloseIcon, onDismiss, closeButtonAriaLabel, isCoachmark } = this.props;

    let imageContent;
    let headerContent;
    let bodyContent;
    let footerContent;
    let closeButton;
    let coachMarkIcon;

    if (isCoachmark) {
      coachMarkIcon = (
        <Icon className={ css('TeachingBubble-icon', styles.icon) } iconName={ 'Lightbulb' } />
      );
    }

    if (illustrationImage && illustrationImage.src) {
      imageContent = (
        <div className={ 'ms-TeachingBubble-header' }>
          <Image { ...illustrationImage as any } />
        </div>
      );
    }

    if (headline) {
      headerContent = (
        <div className={ css(
          'ms-TeachingBubble-header',
          hasCondensedHeadline ?
            'ms-TeachingBubble-header--small ' + styles.headerIsSmall :
            'ms-TeachingBubble-header--large ' + styles.headerIsLarge
        ) }>
          <p className={ css('ms-TeachingBubble-headline', styles.headline) } >
            { headline }
          </p>
        </div>
      );
    }

    if (this.props.children) {
      bodyContent = (
        <div className={ css('ms-TeachingBubble-body', styles.body) }>
          <p className={ css('ms-TeachingBubble-subText', styles.subText) }>
            { this.props.children }
          </p>
        </div>
      );
    }

    if (primaryButtonProps || secondaryButtonProps) {
      footerContent = (
        <div className={ css('ms-TeachingBubble-footer', styles.footer) }>
          { primaryButtonProps && (
            <PrimaryButton
              { ...primaryButtonProps }
              className={ css('ms-TeachingBubble-primaryButton', styles.primaryButton, primaryButtonProps.className) }
            />
          ) }
          { secondaryButtonProps && (
            <DefaultButton
              { ...secondaryButtonProps }
              className={ css('ms-TeachingBubble-secondaryButton', styles.secondaryButton, secondaryButtonProps.className) }
            />
          ) }
        </div>
      );
    }

    if (hasCloseIcon) {
      closeButton = (
        <IconButton
          className={ css('ms-TeachingBubble-closebutton', styles.closeButton) }
          iconProps={ { iconName: 'Cancel' } }
          title={ closeButtonAriaLabel }
          ariaLabel={ closeButtonAriaLabel }
          onClick={ onDismiss }
        />
      );
    }

    return (
      <div className={ css('ms-TeachingBubble-content', styles.content) }>
        { coachMarkIcon }
        { imageContent }
        { closeButton }
        <div className={ css('ms-TeachingBubble-bodycontent', styles.bodyContent) }>
          { headerContent }
          { bodyContent }
          { footerContent }
        </div>
      </div>
    );
  }
}