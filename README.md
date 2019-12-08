# CSYE7200_yelp_recommend
CSYE 7200 big-data_Scala
1. Data prep (Spark & Map Reduce)
  - Rating.scala Select features from datasets https://www.kaggle.com/yelp-dataset/yelp-dataset, store into MongoDB  
  - BuildBigTable.scala Need to change the format of input data in rating (userId, businessId,rating). Read data from MongoDB, convert from string to int to fit in ALS model. Each of our target business will be an int corresponding number to which we want to associate ratings
2. Testing algorithm (Spark & ALS)
  - ALSmodel.scala Split into trainRDD and testingRDD. The test set is the one containing the userId and the business are not 'rated' we want to 'recommend'. Then find the most appropriate parameters for rank and lambda (smallest RMSE)
    - ALS: Find the other business similar to current one; any two similar business can be calculated by ALS algorithm since the similarity is static condidtion.
    - RMSE: The smallest RMSE would be the optimal parameters (rank, lambda), we have 0.94 for RMSE. (20, 30, 50) for rank
  - OfflineRecommend.scala Using the parameter we just found in ALSmodel.scala, then train the model
3. Result (Play Framework)
  - Plot the list of business longitude and latitude on Google map, which are the recommended list for user from the training output.
  - The UI design can apply to any user to get the business markers on map
