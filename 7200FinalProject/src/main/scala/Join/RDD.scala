package Join

import org.apache.spark.SparkContext
import org.apache.spark.rdd.RDD

object RDD {
  def main(args: Array[String]): Unit = {
    val sc = new SparkContext("local[*]","Rdd")

    val line = sc.textFile("/Users/yiqiangwang/IdeaProjects/7200FinalProject/output/review/*.csv")

    val temp = line.map(x=>x.toString.split(",")).map(array=>(array(0),(array(1),array(2)))).sortByKey().map(x=>x._1+","+x._2._1+","+x._2._2).saveAsTextFile("/Users/yiqiangwang/IdeaProjects/7200FinalProject/output/final")

  }

}
