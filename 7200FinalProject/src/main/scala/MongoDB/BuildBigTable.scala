package MongoDB

import org.apache.spark.SparkConf
import org.apache.spark.rdd.RDD
import org.apache.spark.sql.expressions.Window
import org.apache.spark.sql.functions._
import org.apache.spark.sql.{DataFrame, SparkSession}

case class Business( business_id:String,name:String,city:String,state:String,latitude:Double,longitude:Double)
case class rating(user_id:String,business_id:String,stars:Double,date:String)
case class MongoConfig(uri:String,db:String)

object BuildBigTable {
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
    val mergeTable = spark.sql("select ratings.business_id,ratings.user_id,ratings.stars,ratings.date,business.name,business.city,business.state,business.latitude,business.longitude from ratings,business where ratings.business_id=business.business_id")
//    mergeTable.createOrReplaceTempView("bigTable")
    val windowSpec = Window.orderBy("user_id")
    val allCol:DataFrame = mergeTable.withColumn("userID",dense_rank().over(windowSpec))
    val windowSpecTwo = Window.orderBy("business_id")
    val bigTable  =  allCol.withColumn("businessID",dense_rank().over(windowSpecTwo)).drop("user_id").drop("business_id")
    storeInMongoDB(bigTable,"bigTable")
//    mergeTable.select("name", rank,
//      dense_rank().over(windowSpec).as("dense_rank"),
//      row_number().over(windowSpec).as("row_number")

//    val changeBusinessID = spark.sql("SELECT *" +
//      "DENSE_RANK() OVER (PARTITION BY user_id) AS  uid FROM bigTable" ).show(100)
//    storeInMongoDB(changeBusinessID,"UserBigtable")
    spark.stop()

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
