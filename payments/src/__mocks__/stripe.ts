import Stripe from 'stripe'

export const stripe = {
    charges: {
        create: jest.fn().mockResolvedValue({id: 'abcd',})
    }
};

