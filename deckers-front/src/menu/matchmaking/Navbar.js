import React, { Component } from 'react';
import { connect } from "react-redux";
import openSocket from 'socket.io-client';
import { withRouter } from 'react-router-dom';
import { connectToGame, abandonGame, reconnectToGame } from '../../store/actions/matchmaking';

import styled from "styled-components"
import navBackground from '../../graphic/nav_background_03.png'
import buttonBackground from '../../graphic/button_03.png'
import { SOCKET_URL } from '../../generalContainers/App';

let socket;

const StyledNavbar = styled.div`
    width: 20%;
    padding: 0;
    background-image: url(${navBackground});
    background-repeat: repeat-y;
    background-size:contain;
`

const ButtonWrapper = styled.div`
    text-align: center;
    position: relative; 
    top:26rem;
`

const Button = styled.button`
    color: white;

    margin: 1rem 0;
    background-image: url(${buttonBackground});
    background-size: cover;
    width: 70%;
    height: 3.3rem;
    background-repeat: no-repeat;
    border:none;
    font-size: 1.4rem;
    cursor: pointer;

    &:focus {outline:0;}
    &:disabled {opacity: 0.65; cursor: inherit}
`

class Navbar extends Component {
    constructor(props) {
        super(props)
        this.state = { isBusy: false, isSearching: false }

        this.handleConnectToGame = this.handleConnectToGame.bind(this)
        this.handleOnClick = this.handleOnClick.bind(this)
        this.handleAbandon = this.handleAbandon.bind(this)
        this.handleReconnectCall = this.handleReconnectCall.bind(this)
        this.handleSearchCancel = this.handleSearchCancel.bind(this)
    }

    componentDidMount() {
        socket = openSocket(`${SOCKET_URL}/matchmaking`);
    }

    componentWillUnmount() {
        socket.disconnect()
    }

    handleConnectToGame(data) {
        const { usr_id, deck_id, connectToGame, history } = this.props;
        const { game_id } = data

        connectToGame(game_id, usr_id, deck_id, history);
    }

    handleOnClick() {
        const { usr_id, deck_id } = this.props;

        this.setState(state => ({ isSearching: true }))
        socket.emit('join', { usr_id, gameMode: 0, deck_id });

        socket.on("game-ready", (data) => {
            this.handleConnectToGame(data)
        })
    }

    handleAbandon() {
        const { usr_id, abandonGame } = this.props;

        this.setState(state => ({ isBusy: !state.isBusy }))
        abandonGame(usr_id)
        setTimeout(() => this.setState(state => ({ isBusy: !state.isBusy })), 1000)
    }

    handleReconnectCall() {
        const { usr_id, reconnectToGame, history } = this.props;

        reconnectToGame(usr_id, history)
    }

    handleSearchCancel() {
        const { usr_id } = this.props;
        this.setState(state => ({ isSearching: !state.isSearching }))

        socket.emit('leave-queue', { usr_id, gameMode: 0 });
    }

    render() {
        const { deck_id, inGame } = this.props;
        const { isBusy, isSearching } = this.state;

        const isDeckSelected = !!deck_id;

        return (
            <StyledNavbar>
                <ButtonWrapper>
                    {!inGame ?
                        isSearching ?
                            <Button onClick={this.handleSearchCancel}>
                                Cancel
                        </Button>
                            :
                            <Button onClick={this.handleOnClick} disabled={!isDeckSelected}>
                                Find game
                        </Button>
                        :
                        <div>
                            <Button onClick={this.handleReconnectCall} disabled={isBusy}>Reconnect</Button>
                            <Button onClick={this.handleAbandon} disabled={isBusy}>Abandon</Button>
                        </div>
                    }
                </ButtonWrapper>
            </StyledNavbar>
        )
    }
}

function mapStateToProps(state) {
    return {
        usr_id: state.currentUser.user._id,
        inGame: state.currentUser.user.inGame,
        deck_id: state.matchmaking.deck
    };
}


export default withRouter(connect(mapStateToProps, { connectToGame, abandonGame, reconnectToGame })(Navbar))