package Recommend

import org.apache.spark.SparkConf
import org.apache.spark.sql.SparkSession
import org.apache.spark.mllib.recommendation
import org.apache.spark.mllib.recommendation.{ALS, Rating}
import org.apache.spark.rdd.RDD
import org.jblas
import org.jblas.DoubleMatrix

import scala.Option
import scala.collection.mutable


case class BusinessRating(userID:Int,businessID:Int,stars:Double,date:String,latitude:Double,longitude:Double)

case class Recommendation(businessID:Int,score:Double)
case class UserRecs(userID:Int,recs:Seq[Recommendation])
case class BusinessRecs(businessID:Int,recs:Seq[Recommendation])//LFM
case class MongoConfigure(uri:String,db:String)


object OfflineRecommend {
  val Rating_Collection = "bigTable"
  val User_Recs ="OffLineUserRecs"
  val Business_Recs="SameBusinessRecs"
  val User_Max_Recommendation = 20


  def main(args: Array[String]): Unit = {

      val config = Map(
        "spark.core" -> "local[*]",
        "mongo.uri" ->"mongodb://localhost:27017/recommender",
        "mongo.db" -> "recommender"
      )

      implicit  val mongoConfig = MongoConfigure(config("mongo.uri"),config("mongo.db"))

      val sparkConf = new SparkConf().setAppName("OfflineRecommendation").setMaster(config("spark.core"))
      val spark:SparkSession = SparkSession.builder().config(sparkConf).getOrCreate()
      import spark.implicits._

      val ratingRDD = spark.read
        .option("uri",mongoConfig.uri)
        .option("collection","bigTable")
        .format("com.mongodb.spark.sql")
        .load()
        .as[BusinessRating]
        .rdd
        .map(x=>(x.userID,x.businessID,x.stars))
        .cache()



      //get all user & business  make 笛卡尔积 to prediction

      val userRDD = ratingRDD.map(_._1).distinct()
      val businessRDD = ratingRDD.map(_._2).distinct()




//      //train model
      val(rank,iterations,lambda)=(50,5,0.1)
      val trainData = ratingRDD.map(x=>Rating(x._1,x._2,x._3))
      val model = ALS.train(trainData,rank,iterations,lambda)
////
//      //base on user and businesses character,caculate stars,get a recommendation list
      val userBusiness= userRDD.cartesian(businessRDD)//生成空表准备开始填咯
//      //
      val preRatings = model.predict(userBusiness)
//
      val userRecs = preRatings
        .filter(_.rating>0)
        .map(x =>(x.user,(x.product,x.rating)))//rating类自带类
        .groupByKey()
        .map{
          case(userID,recs)=>UserRecs(userID,recs.toList.sortWith(_._2>_._2)
            .take(User_Max_Recommendation)
            .map(x=>Recommendation(x._1,x._2)))
        }.toDF()
      userRecs.write
        .option("uri",mongoConfig.uri)
        .option("collection",User_Recs)
        .mode("overWrite")
        .format("com.mongodb.spark.sql")
        .save()
//
    // base on business character, caculate matrix get recommendation list 用于实时推荐,
      val businessFeatures= model.productFeatures.map{
      case (businessID,features) =>(businessID,new DoubleMatrix(features))
    }
    //电影直间的相似度
      val businessRecs = businessFeatures.cartesian(businessFeatures).filter{
        //因为自己和自己是一要过滤掉
        case (a,b) => a._1 !=b._1
      }.map{
        case(a,b)=>{
          val score = conSin(a._2,b._2)
          (a._1,(b._1,score))
        }
      }.filter(_._2._2 > 0.6)
          .groupByKey()
        .map{
          case (businessID,items) =>BusinessRecs(businessID,items.toList.sortWith(_._2 > _._2).map(x=>Recommendation(x._1,x._2)))
        }
          .toDF
    businessRecs.write
      .option("uri",mongoConfig.uri)
      .option("collection",Business_Recs)
      .mode("overWrite")
      .format("com.mongodb.spark.sql")
      .save()
      spark.stop()



  }
  def conSin(businessOne: DoubleMatrix, businessTwo: DoubleMatrix): Double ={
    businessOne.dot(businessTwo)/businessOne.norm2() * businessTwo.norm2()
  }

//  def makeMap(x:String,flag:Boolean):String ={
//    if(flag){
//      userMap(x)=one
//      verUserMap(one)=x
//      one =one+1
//    }else{
//      businessMap(x)=two
//      verBusinessMap(two)=x
//      two=two+1
//    }
//    userMap("asdf")=2
//    return x
//  }
}
