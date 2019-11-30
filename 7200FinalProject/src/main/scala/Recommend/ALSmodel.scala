package Recommend

import Recommend.StaticRecommend.config
import org.apache.spark.SparkConf
import org.apache.spark.sql.SparkSession

object ALSmodel {
//  val RateMoreMovie = "RateMoreMovies"
//  val RateMoreRecently = "RateMoreRecentlyMovies"
//  val AverageMovie = "AverageMovies"
//  val config = Map(
//    "spark.core" -> "local[*]",
//    "mongo.uri" ->"mongodb://localhost:27017/recommender",
//    "mongo.db" -> "recommender"
//  )
//  def main(args: Array[String]): Unit = {
//    implicit  val mongoConfig = MongoConfig(config("mongo.uri"),config("mongo.db"))
//    //create spark config
//    val sparkConf = new SparkConf().setAppName("DataLoaer").setMaster(config("spark.core"))
//    val spark:SparkSession = SparkSession.builder().config(sparkConf).getOrCreate()
//    import spark.implicits._
//    val ratingDF = spark.read
//      .option("uri",mongoConfig.uri)
//      .option("collection","review")
//      .format("com.mongodb.spark.sql")
//      .load()
//      .as[Rating]
//      .toDF()
//
//
//
//
//  }
}