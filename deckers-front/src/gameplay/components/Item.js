import React, { Component } from 'react';
import styled from "styled-components"

import { Draggable } from 'react-beautiful-dnd';
import { CARD_WIDTH } from '../containers/PlayerBoard';


const StyledItem = styled.div` 
    userSelect: none;
    margin: 0 8px 0 0;
    width: ${props => CARD_WIDTH + 'px'};
    height: 130px;

    background: ${props => props.isDragging ? 'lightgreen' : 'grey'};

    border: ${props => props.isDragDisabled ? 'none' : '2px solid rgba(165, 255, 48, 0.7)'};
    border-style: ${props => props.isDragDisabled ? 'none' : 'solid solid none solid'};

    -webkit-box-shadow: ${props => props.isDragDisabled ? "none" : "0px -1px 2px 3px rgba(165, 255, 48,0.7)"};
    -moz-box-shadow: ${props => props.isDragDisabled ? "none" : "0px -1px 2px 3px rgba(165, 255, 48,0.7)"};
    box-shadow: ${props => props.isDragDisabled ? "none" : "0px -1px 2px 3px rgba(165, 255, 48,0.7)"};
`;

function getStyle(style, snapshot, cardsOnBoardLength, isDestinationNull) {
    if (!snapshot.isDropAnimating) {
        return style;
    }

    const { moveTo, curve, duration } = snapshot.dropAnimation;
    // move to the right spot


    // If card is summoned,x and y of animation should be changed
    // If card is not summoned only x should be changed
    const translate = cardsOnBoardLength == 0 || isDestinationNull ? `translate(${moveTo.x}px, ${moveTo.y + 330}px)` : `translate(${moveTo.x - 50}px, ${moveTo.y}px)`;
    debugger
    // patching the existing style
    return {
        ...style,
        transform: `${translate}`,
        // slowing down the drop because we can
        transition: `all ${curve} ${duration}s`,
    };
}

class Item extends Component {
    render() {
        const { item, index, isMyTurn, cardsOnBoard, isDestinationNull } = this.props;

        const isAffordable = this.props.gold < item.cost ? true : false;
        const isDragDisabled = isAffordable || !isMyTurn;

        return (
            <Draggable
                draggableId={item.id}
                index={index}
                isDragDisabled={isDragDisabled}
            >
                {(provided, snapshot) => {
                    {/* if (snapshot.draggingOver) debugger */ }
                    return (
                        <StyledItem
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            isDragging={snapshot.isDragging}
                            isDragDisabled={isDragDisabled}
                            style={getStyle(provided.draggableProps.style, snapshot, cardsOnBoard.length, isDestinationNull)}
                        >
                            <span>Hp: {item.health}</span>
                            <span>Dmg: {item.damage}</span>
                            <span>Cost: {item.cost}</span>
                        </StyledItem>
                    )
                }}
            </Draggable>
        )
    }
}

export default Item;