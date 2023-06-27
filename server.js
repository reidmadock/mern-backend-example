const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const path = require('path');

const { authMiddleware } = require('./utils/auth');

const { typeDefs, resolvers } = require('./schemas');
const db = require('./config/connection');

// For Apollo version 4 from apollo-server-express
const http = require('http');
const cors = require('cors');
const { json } = require('body-parser');

const PORT = process.env.PORT || 3001;

const app = express();
const httpServer = http.createServer(app);
const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })]
});

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// Create a new instance of Apollo Server
const startApolloServer = async () => {
    await server.start();

    // Add Apollo Server onto Express 4
    app.use(
        '/graphql',
        cors(),
        json(),
        expressMiddleware(server, {
            context: authMiddleware
        }),
    );
    
    // Open database connection
    db.once('open', () => {
        new Promise((resolve) => httpServer.listen(PORT, resolve ));
        console.log(`API Server running on port #${PORT}`);
        console.log(`GraphQL accessable at http://localhost:${PORT}/graphql`);
    });
};

startApolloServer();