package Recommend

import java.text.SimpleDateFormat
import java.util.Date

import org.apache.spark.SparkConf
import org.apache.spark.sql.{DataFrame, SparkSession}



case class Business( business_id:String,name:String,city:String,state:String,latitude:Double,longitude:Double)
case class rating(user_id:String,business_id:String,stars:Double,date:String)

case class MongoConfig(uri:String,db:String)


object StaticRecommend {
  val RateMoreMovie = "RateMoreMovies"
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
    val ratingDF = spark.read
      .option("uri",mongoConfig.uri)
      .option("collection","review")
      .format("com.mongodb.spark.sql")
      .load()
      .as[rating]
      .toDF()
    val businessDF = spark.read
      .option("uri",mongoConfig.uri)
      .option("collection","business")
      .format("com.mongodb.spark.sql")
      .load()
      .as[Business]
      .toDF()
    ratingDF.createTempView("ratings")
    businessDF.createTempView("business")
    //1.history famous
    val rateMoreMovieDF = spark.sql("select business_id,count(business_id) as count from ratings group by business_id ")
    storeInMongoDB( rateMoreMovieDF, RateMoreMovie)
//    val simpledate = new SimpleDateFormat("yyyyMM");


    spark.udf.register("change",(x:String)=>(x.split(" ")(0).split("-")(0)+x.split(" ")(0).split("-")(1)).toInt)
    val ratingOfYM = spark.sql("select business_id,stars,change(date) as yearmonth from ratings")
    ratingOfYM.createOrReplaceTempView("ratingOfMonth")


     spark.sql("select business_id ,count(business_id) as count, yearmonth from ratingOfMonth group by yearmonth,business_id order by yearmonth desc,count desc").write.csv("/Users/yiqiangwang/IdeaProjects/7200FinalProject/output/test")
//    storeInMongoDB(rateMoreRecentltMoviesDF,RateMoreRecently)
  }



  def storeInMongoDB(df:DataFrame,collectionName:String)(implicit mongoConfig: MongoConfig):Unit ={
    df.write
      .option("uri",mongoConfig.uri)
      .option("collection",collectionName)
      .mode("overwrite")
      .format("com.mongodb.spark.sql")
      .save()

  }



}
