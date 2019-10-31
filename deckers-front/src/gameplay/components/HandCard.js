import React, { Component } from 'react';

import { Draggable } from 'react-beautiful-dnd';
import Card from '../Card';
import styled from "styled-components"

import { PLAYER_HAND_ID } from '../containers/PlayerHand';
import { Effect } from '../../store/reducers/helpers/effects';
import { SPELL_ROLE } from '../containers/Game';

const START_ROTATION = -4;
const END_ROTATION = 4;

const CardWrap = styled.div`
    margin: 5px 5px 0 0;

    height:${props => (props.size * 1.4) + "px"};
    max-height: 242px;

    transform: rotate(${props => props.cardRotation + "deg"});
    
    width: ${props => (props.size * 0.55) + "px"};
`

const Placeholder = styled.div`
    position: relative;

    width: ${props => (props.size * 0.55) + "px"};
    height:${props => (props.size * 1.6) + "px"};
    transition: margin 0.2s;

    :hover{ 
        margin-bottom: 30px;
        z-index:3;
    }
`

class HandCard extends Component {
    constructor(props) {
        super(props);
        const uniqueId = '_' + Math.random().toString(36).substr(2, 9) + this.props.index;
        this.state = { uniqueId }
    }

    render() {
        const { item, index, isMyTurn, cardsOnBoard, currentTarget, gold, cardsAmount } = this.props;
        const { uniqueId } = this.state;

        const isAffordable = gold >= item.inGame.stats.cost;
        const canBeSummoned = isMyTurn && isAffordable;

        const isDragDisabled = !isMyTurn;
        const cardAngle = (-START_ROTATION + END_ROTATION) / (cardsAmount - 1)

        return (
            <Draggable
                draggableId={uniqueId}
                index={index}
                isDragDisabled={isDragDisabled}
            >
                {(provided, snapshot) => {
                    let cardRotation = START_ROTATION + (cardAngle * index);
                    if (snapshot.isDragging) cardRotation = 0;
                    return (
                        <Placeholder ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            size={120}
                            style={getStyle(provided.draggableProps.style, snapshot, cardsOnBoard, currentTarget, item, canBeSummoned, cardRotation)}
                        >
                            <CardWrap
                                cardRotation={cardRotation}
                                index={index}
                                size={120}
                                className="card-wrap">
                                <Card card={item} size={120} haveBorder={canBeSummoned} />
                            </CardWrap>
                        </Placeholder>
                    )
                }}
            </Draggable>
        )
    }
}

function getStyle(style, snapshot, cardsOnBoard, currentTarget, card, canBeSummoned, cardRotation) {
    const hasEffects = card.effects && card.effects.onSummon && card.effects.onSummon.length > 0
    const isSingleTargetSpell = hasEffects ? Object.values(Effect.TARGET_LIST.SINGLE_TARGET).includes(card.effects.onSummon[0].target) : false;

    const isSpell = card.role === SPELL_ROLE
    const shouldFadeOut = (isSingleTargetSpell || isSpell) && canBeSummoned;

    // Handles card dragging and spell cards animations
    if (!snapshot.isDropAnimating) {
        if (shouldFadeOut && snapshot.isDragging) {

            // Set cursor and reset it if not needed
            document.body.style.cursor = (currentTarget === PLAYER_HAND_ID) || !currentTarget ? "default" : "pointer";

            return {
                ...style,
                opacity: (currentTarget === PLAYER_HAND_ID) || !currentTarget ? "1" : "0",
            };
        }

        return style;
    }

    // Drop animation
    document.body.style.cursor = "default"; // Reset cursor
    if (hasEffects && shouldFadeOut && snapshot.isDragging)
        return { ...style, opacity: "0" }

    const { moveTo, curve, duration } = snapshot.dropAnimation;
    let translate;

    if (currentTarget === PLAYER_HAND_ID || !canBeSummoned) translate = `translate(${moveTo.x}px, ${moveTo.y}px)`
    else translate = cardsOnBoard.length === 0 ? `translate(${moveTo.x}px, ${moveTo.y + (window.innerHeight / 2)}px)` : `translate(${moveTo.x - 50}px, ${moveTo.y}px)`;

    return {
        ...style,
        transform: `${translate}`,
        transition: `all ${curve} ${duration}s`,
    };
}


export default HandCard;