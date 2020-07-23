import _ from "lodash";
import { decodeHistory } from "../utils/resultsUtils"

/*
    Requirements
*/
export default {
    // initial module state
    state() {
        return {
            cards: [],
            // `child`: `parent` since keys must be unique by values
            parenthood: {},
            edges: [],
        };
    },
    getters: {
        cardIdsByQuery(state) {
            // card.query x card.timestamp -> card.id === position of card in cards?
        },
        cardsByQuery(state) {
            return _.keyBy(state.cards, 'query')
        },
        cardsById(state) {
            // Return cards in the order of creation
            // return _.sortBy(state.cards, 'timestamp')
            return _.sortBy(state.cards, 'id');
        },
        cardsTopological(state, getters) {
            // Return cards in the order of their parents
                // When certain cards exist on the same level, order by their timestamps
            // Each card has one parent (0 encodes for )
                // Let "cards" be state.cards, `T` be a topologically sorted set of cards, and `L` be a dummy variable pronounced "level"
                // Find the root cards, i.e. find all cards with root parent === -1, and place them in `L`
                    // to resolve ambiguity, sort by timestamps?
                // TODO
        },
        encodeHistory(state, getters) {
            const queries = getters.cardsById.map(card => `${card.index};${card.query}`).join(',');  // ordering should equal id
            const edges = state.edges.map(edgePair =>`${edgePair[0]};${edgePair[1]}`).join(',');
            return `${queries}!${edges}`;
        },
    },
    mutations: {
        decodeHistoryAndLoad(state, historyString) {
            const decodedHistory = decodeHistory(historyString);
            state.cards = decodedHistory.cards;
            state.edges = decodedHistory.edges;
            state.parenthood = decodedHistory.parenthood;
        },
        addCard(state, newCard) {
            const card = {
                id: typeof newCard.id != 'undefined' ? newCard.id : state.cards.length, // should start off as 0
                parent: newCard.parent,   // -1 means the root parent -> the query bar at the top of the card page? also means that this should be a card id
                // timestamp: Date.now(),  // TODO: autogenerate this? (TODO: it gets lost in the decoding so who cares)
                index: newCard.index,
                query: newCard.query,
            }
            state.cards.push(card);
            if (typeof card.parent !== "undefined") {  // !!parent won't work here since it makes 0 go to false
                state.edges.push([card.id, card.parent])
                state.parenthood[card.id] = card.parent;
            }
        },
        clearEverything(state) {
            state.cards = [];
            state.edges = [];
            state.parenthood = {};
        }
    },
    actions: {
        addCard(context, { id, index, query, parent }) {
            context.commit('addCard', { id, index, query, parent });
        }
    }
}
