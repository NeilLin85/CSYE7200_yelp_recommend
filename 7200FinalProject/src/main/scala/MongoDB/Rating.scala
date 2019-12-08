package MongoDB


import com.mongodb.casbah.{MongoClient, MongoClientURI}

import org.apache.spark.SparkConf
import org.apache.spark.sql.{DataFrame, SparkSession}

/*
  select feature from datasets, then store them in MongoDB
 */
case class MongoConfigure(uri:String,db:String)

object Rating {
  val review_path = "/Users/yiqiangwang/IdeaProjects/7200FinalProject/source/yelp_academic_dataset_review.json"
  val business_path = "/Users/yiqiangwang/IdeaProjects/7200FinalProject/source/yelp_academic_dataset_business.json"
  val config = Map(
    "spark.core" -> "local[*]",
    "mongo.uri" ->"mongodb://localhost:27017/recommender",
    "mongo.db" -> "recommender"
  )

  def main(args: Array[String]): Unit = {

    implicit  val mongoConfig = MongoConfigure(config("mongo.uri"),config("mongo.db"))
    //create spark config
    val sparkConf = new SparkConf().setAppName("DataLoaer").setMaster(config("spark.core"))

    val spark:SparkSession = SparkSession.builder().config(sparkConf).getOrCreate()
    import spark.implicits._

    //load data
    val reviewDF:DataFrame = spark.read.json(review_path)
    val businessDF:DataFrame = spark.read.json(business_path)

    //sql
    reviewDF.createTempView("review")
    businessDF.createTempView("business")

    storeDataInMongoDB(spark.sql("SELECT user_id,business_id,stars,date from review"),
                    spark.sql("SELECT business_id,name,city,state,latitude,longitude from business"))

    spark.stop()
  }

  def storeDataInMongoDB(review:DataFrame,business:DataFrame)(implicit mongoConfig: MongoConfigure):Unit ={
    //make connection with mongo
    val mongoClient = MongoClient(MongoClientURI(mongoConfig.uri))
    mongoClient(mongoConfig.db)("review").dropCollection()
    mongoClient(mongoConfig.db)("business").dropCollection()

    review.write.option("uri",mongoConfig.uri)
      .option("collection","review")
      .mode("overwrite")
      .format("com.mongodb.spark.sql")
      .save()
    business.write.option("uri",mongoConfig.uri)
      .option("collection","business")
      .mode("overwrite")
      .format("com.mongodb.spark.sql")
      .save()
    mongoClient.close()
  }

}
