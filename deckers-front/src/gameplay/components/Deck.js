import React, { Component } from 'react';
import styled from "styled-components"

import { connect } from "react-redux"
import { drawCard } from "../../store/actions/game"
import { CARD_DRAW_COST } from '../../store/reducers/game';

const StyledDiv = styled.div`
    height: 150px;
    width: 80px;

    position: absolute;
    right: 0;
    bottom: ${props => props.player ? '35%' : 'none'};
    top: ${props => props.player ? 'none' : '18%'};

    background: black;
`;

const StyledButton = styled.button`
    width: 100%
`;

class Deck extends Component {
    render() {
        const isAffortable = this.props.gold >= CARD_DRAW_COST;
        const isDisabled = !isAffortable || !this.props.isMyTurn;

        return (
            <StyledDiv>
                {this.props.player &&
                    <StyledButton
                        onClick={() => this.props.dispatch(drawCard())}
                        disabled={isDisabled}
                    >
                        Buy card
                </StyledButton>
                }
            </StyledDiv>
        )
    }
}

function mapStateToProps(state) {
    return {
        isMyTurn: state.game.isMyTurn
    }
}

export default connect(mapStateToProps)(Deck); 