const express = require('express');
const { ApolloServer } = require('apollo-server');
const path = require('path');

const { authMiddleware } = require('./utils/auth');

const { typeDefs, resolvers } = require('./schemas');
const db = require('./config/connection');

const PORT = process.env.PORT || 3001;
const app = express();
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: authMiddleware
});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Create a new instance of Apollo Server
const startApolloServer = async () => {
    await server.start();
    // Add Apollo Server onto Express
    server.applyMiddleware({ app });

    // Open database connection
    db.once('open', () => {
        app.listen(PORT, () => {
            console.log(`API Server running on port #${PORT}`);
            console.log(`GraphQL accessable at http://localhost:${POST}${server.graphqlPath}`);
        });
    });
};

startApolloServer();