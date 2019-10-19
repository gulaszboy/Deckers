import React, { Component } from 'react';

import styled from "styled-components"
import cardItemBackground from '../../../graphic/card_front_01.png';

import cardCostBoxSkaven from '../../../graphic/race_filter_01.png';
import cardCostBoxDwarf from '../../../graphic/race_filter_02.png';
import cardCostBoxForsaken from '../../../graphic/race_filter_04.png';
import cardCostBoxOrder from '../../../graphic/race_filter_03.png';
import { RACE_LIST, CLASS_LIST } from './CardsContent';
import { STORAGE_STATE } from '../../../store/reducers/storage';

import images from "../../../graphic/card_portraits/forsaken"

const Wrapper = styled.div`
    margin: 0 2%;
    margin-bottom: 10px;

    background-image: url(${props => props.imageURL});
    background-repeat: no-repeat;
    background-size: contain;

    -webkit-user-select: none;        
    -moz-user-select: none; 
    -ms-user-select: none; 
    user-select: none;

    position: relative;

    :hover{
        margin: ${props => props.canBePicked ? '0 calc(2% - 2px)' : "0 2%"};
        margin-bottom: ${props => props.canBePicked ? '8px' : "10px"};

        border-radius: 10px;
        border: ${props => props.canBePicked ? '2px solid rgba(165, 255, 48, 0.7)' : "none"};
        border-style:  ${props => props.canBePicked ? 'solid solid none solid' : 'none'};

        -webkit-box-shadow:  ${props => props.canBePicked ? "0px -1px 2px 3px rgba(165, 255, 48,0.7)" : "none"};
        -moz-box-shadow: ${props => props.canBePicked ? "0px -1px 2px 3px rgba(165, 255, 48,0.7)" : "none"};
        box-shadow: ${props => props.canBePicked ? "0px -1px 2px 3px rgba(165, 255, 48,0.7)" : "none"};
        cursor: ${props => props.canBePicked ? "pointer" : "inherit"};
    }
`

const Card = styled.div`
    height:242px;
    width:173px;
    background-image: url(${cardItemBackground}) !important;
    background-repeat: no-repeat;
    background-size: contain;
    color:white;
`

const CostBox = styled.div`
    background: ${props => `url(${props.background}) no-repeat`};
    background-size: contain;

    display: inline-block;
    font-weight: bold;
    width: 18%;
    padding-left: 11px;
    padding-top: 3px;
`

const Name = styled.div`
    font-size: 14px;

    position: relative;
    top: 102px;

    display: flex;
    justify-content: center;
`

const Stats = styled.div`
    display: flex;
    justify-content: space-between; 

    position: absolute;
    bottom: 7px;
    left: 10px;
    width: 88%;
    font-size: 21px;
`
const Class = styled.div`
    font-size: 12px;

    position: relative;
    top: 15px;
`

const Description = styled.div`
    text-align: center;
    width: 100%;
    height: 55px;

    position: absolute;
    bottom: 19px;
    font-size: 12px;
`

const CenterText = styled.div`
    width:74%;
    margin: auto;
`

class CardsCardItem extends Component {
    constructor(props) {
        super(props);

        this.handleOnClick = this.handleOnClick.bind(this);
    }

    handleOnClick() {
        const { card, addCardToDeck, isDeckFull, currentState } = this.props;
        const canBePicked = currentState !== STORAGE_STATE.IDLE && (isDeckFull === false)
        if (!canBePicked) return;

        addCardToDeck(card.card)
    }

    // <p>{Object.keys(RACE_LIST)[card.card.race]} {Object.keys(CLASS_LIST)[card.card.role]}</p>
    render() {
        const { card: dbCard, currentState, isDeckFull } = this.props;
        const { card } = dbCard;

        const costBoxBackgrounds = [cardCostBoxDwarf, cardCostBoxForsaken, cardCostBoxOrder, cardCostBoxSkaven]
        const costBoxBackground = costBoxBackgrounds[card.race]
        const imageURL = images.get(card.imageID)

        // {currentState !== STORAGE_STATE.IDLE && (isDeckFull === false)
        // <Button onClick={this.handleOnClick}>Add to deck</Button>

        const canBePicked = currentState !== STORAGE_STATE.IDLE && (isDeckFull === false)

        return (
            <Wrapper imageURL={imageURL} canBePicked={canBePicked} onClick={this.handleOnClick}>

                <Card>
                    <CostBox background={costBoxBackground}>
                        <p>{card.stats[dbCard.level].cost}</p>
                    </CostBox>
                    <Name>{card.name}</Name>

                    <Description><CenterText>{card.description}</CenterText></Description>

                    <Stats>
                        <div>{card.stats[dbCard.level].damage}</div>
                        <Class>{Object.keys(CLASS_LIST)[card.role]}</Class>
                        <div>{card.stats[dbCard.level].damage}</div>
                    </Stats>
                </Card>
            </Wrapper>
        )
    }
}

export default CardsCardItem;