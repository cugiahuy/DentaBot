class testLuis {
  postData(context){
    return fetch('https://dental-qna.cognitiveservices.azure.com/language/:analyze-conversations?api-version=2022-10-01-preview', {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': '281ae2f9b115460da9f8e99bbcbc99f8',
            'Apim-Request-Id': '4ffcac1c-b2fc-48ba-bd6d-b69d9942995a',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'kind': 'Conversation',
            'analysisInput': {
                'conversationItem': {
                    'id': 'id__194',
                    'text': context,
                    'modality': 'text',
                    'language': 'en-us',
                    'participantId': 'PARTICIPANT_ID_HERE'
                }
            },
            'parameters': {
                'projectName': 'Dental-luis',
                'verbose': true,
                'deploymentName': 'dental-luis2',
                'stringIndexType': 'TextElement_V8'
            }
        })
    }) 
    .then(response => response.json()); // parses response to JSON
  }
}

module.exports = testLuis;