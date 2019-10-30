import React, { Component } from 'react';
import CardBar from './CardBar';

import styled from "styled-components";

const Button = styled.button`
    background: ${props => props.danger ? "#c8423e" : "#8FC320"} ;
    color: white;

    margin: auto 0 10% 0;
    border: none;
    border-radius: 10px;
    font-size: 24px;
    height: 40px;
    color:white;

    cursor: pointer;

    transition: all 0.2s;
    
    :hover{ background: ${props => props.danger ? "#d9534f" : "#9FD430"}; };
    :focus { outline: none; }
`

const Data = styled.div`
    height: 86%;
    width:100%;

    padding-top:15px;
    text-align: center;
    color:rgb(4, 7, 20);
`

const Panel = styled.div`
    display: flex;
    justify-content: 
    space-evenly;

    width: 100%;
`

class NavbarBusy extends Component {
    constructor(props) {
        super(props);
        const { oldDeckName } = this.props;

        this.state = {
            deckName: oldDeckName ? oldDeckName : ""
        }

        this.handleChange = this.handleChange.bind(this);
        this.handleOnClick = this.handleOnClick.bind(this)
    }

    handleChange(e) {
        this.setState({ [e.target.name]: e.target.value });
    };

    handleOnClick() {
        const { deckName } = this.state;
        const { handleOnClick } = this.props;

        handleOnClick(deckName)
    }

    render() {
        const { deckName } = this.state;
        const { cards, removeCardFromDeck, cancelDeckCreation } = this.props;

        const deckSlotsList = cards.map((card, index) => (
            <CardBar
                key={card._id + " " + index}
                card={card}
                deckSlotNumber={index}
                removeCardFromDeck={removeCardFromDeck}
            />
        ));

        return (
            <>
                <Data>
                    <input type="text" placeholder="Deck name" name="deckName" onChange={this.handleChange} value={deckName} />
                    {deckSlotsList}
                </Data>
                <Panel>
                    <Button onClick={this.handleOnClick} >Confirm</Button>
                    <Button onClick={cancelDeckCreation} danger>Cancel</Button>
                </Panel>
            </>
        )
    }
}

export default NavbarBusy;