object test{
  def main(args: Array[String]): Unit = {
    val k = Console.readInt()
    println(primeStream(Stream.from(2)).take(k).apply(k-1))
  }
  def primeStream(s: Stream[Int]): Stream[Int] =
    Stream.cons(s.head, primeStream(s.tail filter { _ % s.head != 0 }))
}
