package rate

import org.apache.spark.sql.{DataFrame, SparkSession}

object Rating {
  def main(args: Array[String]): Unit = {
    val spark:SparkSession = SparkSession.builder()
      .master("local[1]")
      .appName("MP")
      .getOrCreate()
    //

    val dataFrame:DataFrame = spark.read.json("/Users/yiqiangwang/IdeaProjects/7200FinalProject/source/yelp_academic_dataset_review.json")

    //DSL
    //    dataFrame.filter($"latitude">30).show

    //sql
    dataFrame.createTempView("business")
    spark.sql("SELECT user_id,business_id,stars from business").write.csv("/Users/yiqiangwang/IdeaProjects/7200FinalProject/output/review")

    spark.stop()
  }

}
