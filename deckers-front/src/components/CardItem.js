import React, {Component} from 'react';
import {connect} from 'react-redux';
import {addCardToDeck} from '../store/actions/decks';

class CardItem extends Component{
    render(){
        const {card, currentState, nextAvailableSlot, addCardToDeck} = this.props;
        return(
            <div className="col-2 card-item m-2">
                <h4>{card.card.name}</h4><hr/>
                <p>Amount: {card.amount}</p>
                {currentState==="creating" && (
                    <button onClick={(e)=>{addCardToDeck(card,nextAvailableSlot)}} className="btn">Add to deck</button>
                )}
            </div>
        )
    }

}

function mapStateToProps(state){
    return{
        currentState:state.decks.currentState,
        nextAvailableSlot:state.decks.nextAvailableSlot
    }
}

export default connect(mapStateToProps, {addCardToDeck})(CardItem);