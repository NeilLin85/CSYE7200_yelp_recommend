package business

import org.apache.spark.sql.{DataFrame, SparkSession}

object MapReduce {
  def main(args: Array[String]): Unit = {
    //sparksession
      val spark:SparkSession = SparkSession.builder()
        .master("local[1]")
        .appName("MP")
        .getOrCreate()
    //

    val dataFrame:DataFrame = spark.read.json("/Users/yiqiangwang/IdeaProjects/7200FinalProject/source/yelp_academic_dataset_business.json")

    //DSL
//    dataFrame.filter($"latitude">30).show

    //sql
    dataFrame.createTempView("business")
    spark.sql("SELECT business_id,name,city,state,latitude,longitude from business").write.csv("/Users/yiqiangwang/IdeaProjects/7200FinalProject/output/result")

    spark.stop()







  }
}
