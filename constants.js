const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;


module.exports = {PASSWORD_REGEX,EMAIL_REGEX}



// {
//     "id": "2830524b0e8",
//     "videoSrc": "https://videosurvey.xircular.io/temp/video-1715434340546.mp4",
//     "questions": [
//       {
//         "id": "f9e95e52fd9",
//         "question": "Did you like the concert?",
//         "answers": [
//           {
//             "answer": "Yes",
//             "id": ""
//           },
//           {
//             "answer": "No",
//             "id": "903aff63327"
//           }
//         ],
//         "multiple": false,
//         "skip": false,
//         "time": 2.1,
//         "formattedTime": "00:02.1"
//       },
//       {
//         "id": "6f4ee901f2b",
//         "question": "What aspects of the concerts did you liked?",
//         "answers": [
//           {
//             "answer": "Well organised",
//             "id": ""
//           },
//           {
//             "answer": "Time well spent",
//             "id": "007a7292e78"
//           },
//           {
//             "answer": "Good vibes",
//             "id": "18c1d169a0a"
//           }
//         ],
//         "multiple": true,
//         "skip": true,
//         "time": 5.2,
//         "formattedTime": "00:05.2"
//       },
//       {
//         "id": "684a9186f7c",
//         "question": "What aspects of the concert did you disliked?",
//         "answers": [
//           {
//             "answer": "Well organiseed",
//             "id": ""
//           },
//           {
//             "answer": "Time well spent",
//             "id": "85747bc731a"
//           },
//           {
//             "answer": "Good vibes",
//             "id": "6688373db14"
//           }
//         ],
//         "multiple": true,
//         "skip": true,
//         "time": 8.6,
//         "formattedTime": "00:08.6"
//       }
//     ]
//   }


// {
//     "videoId": "12345456552",
//     "clientId": "0b364775-d4b5-4dba-96c1-8e91a33bb310",
//     "response": [
//       {
//           "question": "Did you like the concert?",
//           "ans": [
//               "Yes"
//           ],
//           "skip": false
//       },
//       {
//           "question": "What aspects of the concerts did you liked?",
//           "ans": [],
//           "skip": true
//       },
//       {
//           "question": "What aspects of the concert did you disliked?",
//           "ans": [],
//           "skip": true
//       }
//   ],
//      "isStartServey": true,
//      "isEndSurvey": true
//   }
  
    