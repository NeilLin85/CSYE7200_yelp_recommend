import org.apache.spark.{SparkConf, SparkContext}
import org.scalatest.FlatSpec

class RatingMovieSpec extends FlatSpec{

  val dataPath = "resources//data//rating.csv"
  val conf = new SparkConf().setMaster("local").setAppName("reduce")
  val sc = new SparkContext(conf)

  "Number of Movies" should " be 134 " in {
    assert(RatingMovie.rating(sc.textFile(dataPath, 3)).collect.length == 134)
  }
  "Highest Rating Movies " should " be 318 with rating 4.429" in{
    assert(RatingMovie.rating(sc.textFile(dataPath, 3)).collect.takeRight(1).sameElements(Array(("318","4.429","0.712"))))
  }

  "MovieID 4995" should " Average be 4.000, STD be 0.768" in{
    assert(RatingMovie.rating(sc.textFile(dataPath, 3)).collect.filter(_._1 =="4995").sameElements(Array(("4995", "4.000", "0.768"))))
  }
}
