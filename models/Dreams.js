const mongoose = require('mongoose')

const DreamSchema = new mongoose.Schema(
    {
        date: {
            type: Date,
            required: [true, 'Please provide date'],
        },
        createdBy: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: [true, 'Please provide user'],
        },
        description: {
            type: String,
            required: [true, 'Please provide a description of the dream'],
        },
        number: {
            type: Number, //this is the number for a single date of dreams. a lot of people remember multiple dreams from a single night.
            required: [true, 'Please provide a number'],
        },
        analysis: {
            emotions: {
                type: [String], // List of emotions
                required: true,
            },
            themes: {
                type: [String], // List of themes
                required: true,
            },
            people: {
                type: [String], // List of people including the dreamer
                required: true,
            },
            locations: {
                type: [String], // List of general locations
                required: true,
            },
            keywords: {
                type: [String], // List of keywords
                required: true,
            },
            interpretation: {
                type: String, // Paragraph interpreting the hidden meaning/symbolism. (PREMIUM FEATURE) If user is not premium, says "NOT PREMIUM"
                required: true,
            }
        }
    },
    { timestamps: true }
)

module.exports = mongoose.model('Dream', DreamSchema)
