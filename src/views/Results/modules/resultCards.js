import _ from "lodash";


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
        cardsChronological(state) {
            // Return cards in the order of creation
            // return _.sortBy(state.cards, 'timestamp')
            return state.cards;
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
        cardsReverseChronological(state) {
            return state.getters.cardsChronological.slice().reverse();
        },
        cardsReverseTopological(state) {
            return state.getters.cardsTopological.slice().reverse();
        },
        encodeHistory(state) {
            const queries = ``
            const edges = ``
            return `${queries}!${edges}`;
        },
    },
    mutations: {
        decodeHistoryAndLoad(state, historyString) {
            const [preQueries, preEdges] = historyString.split('!');
            
            // const edgePairs = preEdges.match(/.{2}/g);
            for (let i = 0, charsLength = preEdges.length; i < charsLength; i += 2) {
                const [child, parent] = preEdges.substring(i, i + 2);
                state.edges.push(Object.freeze([child, parent]))
                state.parenthood[child] = parent;
            };

            // TODO
            const queries = preQueries.split(',');
            state.queries = queries.map((content, inc) => {
                const [index, query] = content.split(';');
                return { id: inc, index, query };
            });
        },
        addCard(state, { query, index, parent }) {
            const card = {
                id: state.cards.length, // should start off as 0
                // parent: parent || -1,   // -1 means the root parent -> the query bar at the top of the card page? also means that this should be a card id
                // timestamp: Date.now(),  // TODO: autogenerate this? (TODO: it gets lost in the decoding so who cares)
                index,
                query,
            }
            state.cards.push(card);
            if (!!parent) {
                state.edges.push(Object.freeze([card.id, parent])) 
                state.parenthood[card.id] = parent;    
            }

        }
    },
    actions: {
        addCard(context, query, parent) {
            context.commit('addCard', { query, parent });
        }
    }
}
