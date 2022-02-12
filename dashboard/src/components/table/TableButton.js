import React, { Component } from 'react';
import RenderIfAdmin from '../basic/RenderIfAdmin';
import RenderIfOwner from  '../basic/RenderIfOwner';
import RenderIfMember from '../basic/RenderIfMember';
import RenderIfViewer from '../basic/RenderIfViewer';


export default class TableButton extends Component {

    constructor(props) {
        super(props);
    }

    getButtonElement() {
        const { title, shortcutKey, id, onClick } = this.props;

        return (<button
            id={id}
            onClick={onClick}
            className="Button bs-ButtonLegacy ActionIconParent"
            type="button"
        >
            <div className="bs-ButtonLegacy-fill Box-root Box-background--white Flex-inlineFlex Flex-alignItems--center Flex-direction--row Padding-horizontal--8 Padding-vertical--4">
                <div className="Box-root Margin-right--8">
                    <div className="SVGInline SVGInline--cleaned Button-icon ActionIcon ActionIcon--color--inherit Box-root Flex-flex"></div>
                </div>
                <span className="bs-Button bs-FileUploadButton bs-Button--icon bs-Button--new keycode__wrapper">
                    <span>{title}</span>
                    {shortcutKey && <span className="new-btn__keycode">
                        {shortcutKey}
                    </span>}
                </span>
            </div>

        </button>)
    }

    render() {
        const { visibleForOwner, visibleForAdmin, visibleForViewer, visibleForMember } = this.props;

        if(visibleForAdmin){
            return (
                <RenderIfAdmin>
                    {this.getButtonElement()}
                </RenderIfAdmin>
            )
        }

        if(visibleForViewer){
            return (
                <RenderIfViewer>
                    {this.getButtonElement()}
                </RenderIfViewer>
            )
        }
        
        if(visibleForMember){
            return (
                <RenderIfMember>
                    {this.getButtonElement()}
                </RenderIfMember>
            )
        }

        if(visibleForOwner){
            return (
                <RenderIfOwner>
                    {this.getButtonElement()}
                </RenderIfOwner>
            )
        }


        return this.getButtonElement();

    }
}
