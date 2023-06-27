 const { AuthenticationError } = require('@apollo/server');
 const { Profile } = require('../models');
 const { signToken } = require('../utils/auth');

 const resolvers = {
    Query: {
        profiles: async () => {
            return Profile.find();
        },

        profile: async (parent, { profileId }) => {
            return Profile.findOne({ _id: profileId });
        },

        // Query that uses context, we can retrieve the logged in user without specifically searching for them
        me: async (parent, args, context) => {
            if (context.user) {
                return Profile.findOne({ _id: context.user._id });
            }
            throw new AuthenticationError('You must be logged in for this feature!');
        },
    },

    Mutation: {
        addProfile: async (parent, { name, email, password }) => {
            const profile = await Profile.create({ name, email, password });
            const token = signToken(profile);

            /*
             Succesfully created new profiles are automatically given a login token
             Return example: { token: 'token data', profile: { name:'', email:'', _id:'' }}
             TypeDefs ensure passwords are NOT returned from the server.
            */
            return { token, profile }; 
        },
        login: async (parent, { email, password }) => {
            const profile = await Profile.findOne({ email });

            // Check if a matching email is found
            if (!profile) {
                // Throw intentionally obtuse error for security purposes
                throw new AuthenticationError('Username or Password was incorrect!');
            }

            const correctPw = await profile.isCorrectPassword(password);

            if (!correctPw) {
                // Throw intentionally obtuse error for security purposes
                throw new AuthenticationError('Username or Password was incorrect!');
            }

            /*
             Succesfully validated profiles are given a login token
             Return example: { token: 'token data', profile: { name:'', email:'', _id:'' }}
             TypeDefs ensure passwords are NOT returned from the server.
            */
            const token = signToken(profile);
            return { token, profile };
        },
        // Set up mutation so a logged in user can only remove their own profile and no one else's
        removeProfile: async (parent, args, context) => {
            if (context.user) {
                return Profile.findOneAndDelete({ _id: context.user._id });
            }
            throw new AuthenticationError('You must be logged in to perform this action!');
        }
    }
}

module.exports = resolvers;