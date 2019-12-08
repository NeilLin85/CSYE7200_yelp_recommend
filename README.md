# CSYE7200_yelp_recommend
CSYE 7200 big-data_Scala
1. Data prp (Map Reduce)
  - Rating.scala Select features from business.json, store result to MongoDB
  - BuildBigTable.scala Convert key from string to int to fit in ALS model
2. Testing algorithm (ALS)
  - ALSmodel.scala Test for appropriate parameters for rank and lambda
    - ALS: Find the other business similar to current one; any two similar business can be calculated by ALS algorithm since the similarity is static condidtion; The result of calculating will be store into MongoDB
    - RMSE: The smallest RMSE would be the optimal parameters (rank, lambda)
  - OfflineRecommend.scala Using the parameter we just found in ALSmodel.scala, then train the model
3. Result (Play Framework)
  - Plot the list of business longitude and latitude on Google map, which are the recommended list for user from ALSmodel.scala output.
  - The UI design can apply to any user to get the business markers on map
