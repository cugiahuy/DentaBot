// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// const { ActivityHandler, MessageFactory } = require('botbuilder');
const { ActivityHandler, ActivityTypes, ConsoleTranscriptLogger } = require('botbuilder');
// const { QnAMaker } = require('botbuilder-ai');
const DentistScheduler = require('./dentistscheduler.js');
const IntentRecognizer = require('./intentrecognizer');
const TestLuis = require('./testhttp.js');
const { CustomQuestionAnswering } = require('botbuilder-ai');

class DentaBot extends ActivityHandler {
    constructor(configuration) {
        super();

        try {
            this.qnaMaker = new CustomQuestionAnswering({
                knowledgeBaseId: process.env.ProjectName,
                endpointKey: process.env.LanguageEndpointKey,
                host: process.env.LanguageEndpointHostName
            });
        } catch (err) {
            console.warn(`QnAMaker Exception: ${ err } Check your QnAMaker configuration in .env`);
        }

        this.TestLuis_1 = new TestLuis();
        // console.log(this.TestLuis_1.postData())

        this.DentistScheduler_1 = new DentistScheduler();

        // If a new user is added to the conversation, send them a greeting message
        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Welcome to Dentist Schedule Assistant.  I can help you find and schedule an appointment.  You can say "What appointments are available?" or "Can I book at 10am?" or ask a question about our service';
            for (let cnt = 0; cnt < membersAdded.length; cnt++) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    const DefaultWelcomeMessageFromConfig = process.env.DefaultWelcomeMessage;
                    await context.sendActivity(DefaultWelcomeMessageFromConfig?.length > 0 ? DefaultWelcomeMessageFromConfig : welcomeText);
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });

        // When a user sends a message, perform a call to the QnA Maker service to retrieve matching Question and Answer pairs.
        this.onMessage(async (context, next) => {
            if (!process.env.ProjectName || !process.env.LanguageEndpointKey || !process.env.LanguageEndpointHostName) {
                const unconfiguredQnaMessage = 'NOTE: \r\n' +
                    'Custom Question Answering is not configured. To enable all capabilities, add `ProjectName`, `LanguageEndpointKey` and `LanguageEndpointHostName` to the .env file. \r\n' +
                    'You may visit https://language.cognitive.azure.com/ to create a Custom Question Answering Project.';

                await context.sendActivity(unconfiguredQnaMessage);
            } else {
                console.log('Calling CQA and LUIS');
                console.log(context.activity.text);
                const enablePreciseAnswer = process.env.EnablePreciseAnswer === 'true';
                const displayPreciseAnswerOnly = process.env.DisplayPreciseAnswerOnly === 'true';
                const response = await this.qnaMaker.getAnswers(context, { enablePreciseAnswer: enablePreciseAnswer });
                
                // console.log(testLuis_res.result.prediction);

                // // send user input to LUIS
                // const LuisResult = await this.intentRecognizer.executeLuisQuery(context);    
                const LuisResult = await this.TestLuis_1.postData(context.activity.text); 

                // Determine which service to respond with //
                if (LuisResult.result.prediction.topIntent === "GetAvailability" &&
                    LuisResult.result.prediction.intents[0].confidenceScore > .6
                ) {
                    const getAvai = await this.DentistScheduler_1.getAvailability();
                    // call api with location entity info
                    const getAvaiRes = "I found an availability at " + getAvai;
                    // console.log(getAvaiRes)
                    await context.sendActivity(getAvaiRes);
                    await next();
                    return;
                }

                // Determine which service to respond with //
                if (LuisResult.result.prediction.topIntent === "ScheduleAppointment" &&
                LuisResult.result.prediction.intents[0].confidenceScore > .6 &&
                LuisResult.result.prediction.entities[0].text != []
                ) {
                const scheduleApt = await this.DentistScheduler_1.scheduleAppointment(LuisResult.result.prediction.entities[0].text);
                // call api with location entity info
                const scheduleAptRes = "You are schedule at " + scheduleApt;
                console.log(scheduleAptRes)
                await context.sendActivity(scheduleAptRes);
                await next();
                return;
                }

                // If an answer was received from CQA, send the answer back to the user.
                if (response.length > 0) {
                    var activities = [];

                    var answerText = response[0].answer;

                    // Answer span text has precise answer.
                    var preciseAnswerText = response[0].answerSpan?.text;
                    if (!preciseAnswerText) {
                        activities.push({ type: ActivityTypes.Message, text: answerText });
                    } else {
                        activities.push({ type: ActivityTypes.Message, text: preciseAnswerText });

                        if (!displayPreciseAnswerOnly) {
                            // Add answer to the reply when it is configured.
                            activities.push({ type: ActivityTypes.Message, text: answerText });
                        }
                    }
                    await context.sendActivities(activities);
                    // If no answers were returned from QnA Maker, reply with help.
                } else {
                    await context.sendActivity('No answers were found.');
                }
            }

            // By calling next() you ensure that the next BotHandler is run.
            await next();
        });
    }
}

module.exports.DentaBot = DentaBot;
