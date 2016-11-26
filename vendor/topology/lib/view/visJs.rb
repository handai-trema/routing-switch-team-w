require 'json'

module View
  # Topology controller's GUI (vis).
  class VisJs
    def initialize(output = './tmp/topology.json')
      @output = output
    end

    # rubocop:disable AbcSize
    def update(_event, _changed, topology)
      nodes = topology.switches.each_with_object({}) do |each, tmp|
        tmp[each] = { "id"=> each, "label"=> each.to_hex }
      end
      i = 0
      links = topology.links.each_with_object({}) do |each, tmp|
        next unless nodes[each.dpid_a] && nodes[each.dpid_b]
        tmp[i] = { "id"=> 10000+i, "from"=> each.dpid_a, "to"=> each.dpid_b }
        i += 1
      end
      i = 0
      hosts = topology.hosts.each_with_object({}) do |each, tmp|
        tmp[i] = { "id"=> 100+i, "label"=> each[0].to_s }
        i += 1
      end
      i = 0
      h_links = topology.hosts.each_with_object({}) do |each, tmp|
#        tmp[nodes.length+i] = { "from"=> each[2], "to"=> nodes.length+i+2 }
         tmp[nodes.length+i] = { "id"=> 10000+nodes.length+i, "from"=> each[2], "to"=> 100+i }
        i += 1
      end
#path
      open(@output, "w") do |io|
        JSON.dump([ "nodes"=> nodes.values, "hosts"=> hosts.values, "links"=> links.merge(h_links).values, "paths"=>topology.paths], io)
      end
    end
    # rubocop:enable AbcSize

    def to_s
      "vizJs mode, output = #{@output}"
    end
  end
end
