package Recommend


import breeze.numerics.sqrt
import org.apache.spark.SparkConf
import org.apache.spark.mllib.recommendation.{ALS, MatrixFactorizationModel, Rating}
import org.apache.spark.rdd.RDD
import org.apache.spark.sql.SparkSession
case class BusinessAddUser(userID:Int,businessID:Int,stars:Double)
object ALSmodel {
  val RateMoreBusiness= "RateMoreBusiness"
  val RateMoreRecently = "RateMoreRecentlyMovies"
  val AverageMovie = "AverageMovies"
  val config = Map(
    "spark.core" -> "local[*]",
    "mongo.uri" ->"mongodb://localhost:27017/recommender",
    "mongo.db" -> "recommender"
  )
  def main(args: Array[String]): Unit = {
    implicit  val mongoConfig = MongoConfig(config("mongo.uri"),config("mongo.db"))
    //create spark config
    val sparkConf = new SparkConf().setAppName("DataLoaer").setMaster(config("spark.core"))
    val spark:SparkSession = SparkSession.builder().config(sparkConf).getOrCreate()
    import spark.implicits._
    val ratingRDD = spark.read
      .option("uri",mongoConfig.uri)
      .option("collection","bigTable")
      .format("com.mongodb.spark.sql")
      .load()
      .as[BusinessAddUser]
      .rdd
      .map(x=>Rating(x.userID,x.businessID,x.stars))
      .cache()
    //Random split training part,testing part
    val split = ratingRDD.randomSplit(Array(0.2,0.08))
    val trainRDD = split(0)
    val testingRDD = split(1)

    adjustALSParameter(trainRDD,testingRDD)
  }
  def adjustALSParameter(trainRDD: RDD[Rating], testingRDD: RDD[Rating]):Unit={
    val result = for(rank <- Array(20,30,50);lambda <-Array(0.001,0.01,0.1))
      yield {
        val model = ALS.train(trainRDD,rank,10,lambda)
        val rmse = getRMSE(model,testingRDD)
        (rank,lambda,rmse)
    }
    print(result.minBy(_._3))
  }
  def getRMSE(model: MatrixFactorizationModel, value: RDD[Rating]):Double ={
      val userProducts = value.map(x=>(x.user,x.product))//继续笛卡尔空矩阵

      val predictRating = model.predict(userProducts)
      //预测和原始值做inner join
      val observed = value.map(x => ((x.user,x.product),x.rating))
      val predict = predictRating.map(x=>((x.user,x.product),x.rating))
     sqrt(  observed.join(predict)//(userid,businessid),(actual,prediction)
       .map{
         case((uid,bid),(actual,predition)) => val erro = actual - predition
           erro * erro
       }.mean())

  }
}