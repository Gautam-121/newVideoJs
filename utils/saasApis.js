const axios = require("axios")
const { SUBSCRIPTION_API , USER_DETAILS_API } = require("../constants.js")

// handler function to check plan expiry
async function checkPlanExpired(bearerToken) {
    try {
  
      // Make a request to the subscription management server to fetch the user's subscription details
      const subscriptionResponse = await axios.get(`${SUBSCRIPTION_API}`,{
        headers: {
          'authorization': `${bearerToken}`
        }
      });
  
      return subscriptionResponse
  
    } catch (error) {
      console.log("Api Error" , error)
      return false
    }
}

// handler function to get User Detail with subscription
const getUserSubscriptions = async (apiKey) => {
  try {
    const SAAS_API_URL = "https://stream.xircular.io/api/v1/subscription/getSubscriptionByApiKey"
    const subscriptionResponse = await axios.get(`${SAAS_API_URL}`, {
      headers: {
        'X-API-Key': apiKey 
      },
    });
    
    if(!subscriptionResponse ||  subscriptionResponse.data.length == 0){
      return false
    }

    return subscriptionResponse.data[0] 
  } catch (error) {
    console.error('Error fetching user subscription:', error.message);
    return false
  }
}
module.exports = {
    checkPlanExpired,
    getUserSubscriptions
}