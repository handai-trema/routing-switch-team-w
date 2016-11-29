# Finds shortest path.
class BandFirstSearch #20161129 change by ginnan
  # Graph node
  class Node
    attr_reader :name
    attr_reader :neighbors
    attr_accessor :distance
    attr_reader :prev
    attr_accessor :visited

    def initialize(name, neighbors)
      @name = name
      @neighbors = neighbors
      @distance = 100_000
      @prev = nil
      @visited = false
    end

    def maybe_update_distance_and_prev(min_node)
      new_distance = min_node.distance + 1
      return if new_distance > @distance
      @distance = new_distance
      @prev = min_node
    end

    def <=>(other)
      @distance <=> other.distance
    end
  end

  # Sorted list.
  # TODO: Replace with heap.
  class SortedArray
    def initialize(array)
      @array = []
      array.each { |each| @array << each }
      @array.sort!
    end

    def method_missing(method, *args)
      result = @array.__send__ method, *args
      @array.sort!
      result
    end
  end

  def initialize(graph)
    @all = graph.map { |name, neighbors| Node.new(name, neighbors) }
    @unvisited = SortedArray.new(@all)
  end

  def run(start, goal)
    find(start, @all).distance = 0
    dst = find(goal, @all)
    tmp = find(start, @all)
    reserved = []
    while tmp != dst do
      tmp.visited = true
      maybe_update_neighbors_of(tmp)
      for i in 0..(tmp.neighbors.length - 1) do
        a = find(tmp.neighbors[i], @all)
        reserved << a
      end
      tmp = reserved.shift
      while tmp.visited do
        tmp = reserved.shift
      end
      for i in 0..(@unvisited.length - 1) do
        if @unvisited.include?(tmp)
          @unvisited.delete_at(i)
        end
      end
    end
    result = path_to(goal)
    result.include?(start) ? result : []
  end

  private

  def maybe_update_neighbors_of(min_node)
    min_node.neighbors.each do |each|
      find(each, @all).maybe_update_distance_and_prev(min_node)
    end
  end

  # This method smells of :reek:FeatureEnvy but ignores them
  # This method smells of :reek:DuplicateMethodCall but ignores them
  def path_to(goal)
    [find(goal, @all)].tap do |result|
      result.unshift result.first.prev while result.first.prev
    end.map(&:name)
  end

  def find(name, list)
    found = list.find { |each| each.name == name }
    fail "Node #{name.inspect} not found" unless found
    found
  end
end

