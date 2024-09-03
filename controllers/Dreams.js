const Dream = require('../models/Dreams')
const dreamAccounts = require('../models/DreamAccount')
const { StatusCodes } = require('http-status-codes')
const { BadRequestError, NotFoundError } = require('../errors')

const { Configuration, OpenAIApi } = require('openai')

const config = new Configuration({
    apiKey: process.env.API_KEY_ENV,
});

const openai = new OpenAIApi(config);

const checkPremiumStatus = async () => { //interpretation is only available to users who are paying for a premium membership.
    const userId = req.user.userId;
    const specificDreamAccount = await dreamAccounts.findById(userId)
    return specificDreamAccount.premium
}

const runPrompt = async (userDream) => {
    const isPremium = await checkPremiumStatus();
    if (isPremium) {
        const prompt = `
       Analyze the following dream:

       ${userDream}

       The analysis should be in the following parsable JSON format:

       {
	        “emotions”: “list of emotions”,
	        “themes”: “list of themes”,
	        “people”: “list of people including myself”,
	        “locations”: “list of general locations”,
	        “keywords”: “list of keywords”,
	        “interpretation”: “paragraph interpreting the hidden meaning/symbolism behind the key elements, objects, and scenarios of the dream”,
        }
    `;
    }
    else {
        const prompt = `
       Analyze the following dream:

       ${userDream}

       The analysis should be in the following parsable JSON format:

       {
	        “emotions”: “list of emotions”,
	        “themes”: “list of themes”,
	        “people”: “list of people including myself”,
	        “locations”: “list of general locations”,
	        “keywords”: “list of keywords”,
        }
    `;
    }
    try {
        const response = await openai.createCompletion({
            model: "text-davinci-003",
            prompt: prompt,
            max_tokens: 2048,
            temperature: 1,
        });

        const parsableJSONresponse = response.data.choices[0].text;
        const parsedResponse = JSON.parse(parsableJSONresponse);
        if (!isPremium) {
            parsedResponse.interpretation = "NOT PREMIUM"
        }
        return parsedResponse;
    } catch (error) {
        throw new BadRequestError('Error analyzing dream');
        return null;
    }
};

const getDream = async (req, res) => { //gets the dream based on the certain date
    const {
        user: { userId },
        params: { date: dreamDate, number: dreamNumber },
    } = req

    const dream = await Dream.findOne({
        date: dreamDate,
        createdBy: userId,
        number: dreamNumber,
    })
    if (!dream) {
        throw new NotFoundError(`No dream with date ${dreamDate}`)
    }
    res.status(StatusCodes.OK).json({ dream })
}

const createDream = async (req, res) => {
    try {
        const dreamDescription = req.body
        const parsedAnalysis = await runPrompt(dreamDescription)
        req.structure = {};
        const largestNumber = 0;
        const dream = await Dream.findOne({ date: req.params.date, createdBy: req.user.userId })
            .sort({ number: -1 })
            .exec();
        if (dream) {
            largestNumber = dream.number;
        }
        if (dreamDescription === '') {
            throw new BadRequestError('The dream description cannot be empty')
        }
        req.structure.createdBy = req.user.userId
        req.structure.date = req.params.date
        req.structure.number = largestNumber + 1;
        req.structure.description = dreamDescription
        req.structure.analysis = {
            emotions: parsedAnalysis.emotions,
            themes: parsedAnalysis.themes,
            people: parsedAnalysis.people,
            locations: parsedAnalysis.locations,
            keywords: parsedAnalysis.keywords,
            interpretation: parsedAnalysis.interpretation // Only if the user is premium, otherwise it will be "NOT PREMIUM"
        };
        const createdDream = await Dream.create(req.structure)
        res.status(StatusCodes.CREATED).json({ createdDream })
    } catch (error) {
        throw new NotFoundError(`No dream from the date ${req.params.date}`)
    }

}

const updateDream = async (req, res) => {
    const {
        body: { description },
        user: { userId },
        params: { date: dreamDate, number: dreamNumber },
    } = req
    const parsedAnalysis = await runPrompt(req.body)
    if (description === '') {
        throw new BadRequestError('The dream description cannot be empty')
    }
    const dream = await Dream.findOneAndUpdate(
        { date: dreamDate, createdBy: userId, number: dreamNumber },
        {
            description: req.body,
            "analysis.emotions": parsedAnalysis.emotions,
            "analysis.themes": parsedAnalysis.themes,
            "analysis.people": parsedAnalysis.people,
            "analysis.locations": parsedAnalysis.locations,
            "analysis.keywords": parsedAnalysis.keywords,
            "analysis.interpretation": parsedAnalysis.interpretation
        },
        { new: true, runValidators: true }
    )
    if (!dream) {
        throw new NotFoundError(`No dream from the date ${dreamDate}`)
    }
    res.status(StatusCodes.OK).json({ dream })
}

const deleteDream = async (req, res) => {
    const {
        user: { userId },
        params: { date: dreamDate, number: dreamNumber },
    } = req

    const dream = await Dream.findOneAndDelete({
        date: dreamDate,
        createdBy: userId,
        number: dreamNumber,
    })
    if (!dream) {
        throw new NotFoundError(`No dream from the date ${dreamDate}`)
    }
    await Dream.updateMany(
        {
            date: dreamDate,
            createdBy: userId,
            number: { $gt: dreamNumber },
        },
        { $inc: { number: -1 } }
    );
    res.status(StatusCodes.OK).send()
}

module.exports = {
    getDream,
    createDream,
    updateDream,
    deleteDream,
}
