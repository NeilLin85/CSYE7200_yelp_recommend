package Categories



import org.apache.spark.{SparkConf, SparkContext}
import org.apache.spark.sql.{DataFrame, Dataset, SparkSession}
import scala.collection.mutable.Set
import scala.collection.mutable

case class MongoConfig(uri:String,db:String)


object RDD {

  val business_path = "/Users/yiqiangwang/IdeaProjects/7200FinalProject/source/yelp_academic_dataset_business.json"
  val config = Map(
    "spark.core" -> "local[1]",
  "mongo.uri" ->"mongodb://localhost:27017/recommender",
  "mongo.db" -> "recommender"
  )

  def main(args: Array[String]): Unit = {
    val set = mutable.Set("")
    val newset = mutable.Set("")
    //create spark config
    val sparkConf = new SparkConf().setAppName("DataLoaer").setMaster(config("spark.core"))
    val sc =new SparkContext(sparkConf)
    val spark:SparkSession = SparkSession.builder().config(sparkConf).getOrCreate()
    import spark.implicits._

    //load data
    val businessDF:DataFrame = spark.read.json(business_path)
    businessDF.createTempView("business")
    spark.sql("SELECT categories from business")
          .map(x=>x.toString().split(","))
         .flatMap(x=>x.map(check(_,set))).filter(!_.equals("N/A"))
         .toDF.write.csv("/Users/yiqiangwang/IdeaProjects/7200FinalProject/output/Gn")

  }
  def check(x:String,set:Set[String]): String ={
      var string =x
    if(x.charAt(0).equals('['))string= x.substring(1,x.length)
    else if(x.charAt(x.length-1).equals(']'))string= x.substring(0,x.length-1)
    if(set.add(string.trim)) {
          return string.trim
      }
    else return "N/A"
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
