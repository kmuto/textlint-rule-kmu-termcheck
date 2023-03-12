#!/usr/bin/env ruby
terms = {}
ARGV.each do |fname|
  File.open(fname) do |f|
    lno = 0
    f.each_line do |l|
      lno += 1
      next if l.start_with?('#')
      term = l.chomp.downcase
      terms[term] = [] unless terms[term]
      terms[term].push("#{fname}:#{lno}")
    end
  end
end

terms.each_pair do |term, locations|
  next if locations.size == 1
  puts "#{term}: #{locations.join(', ')}"
end
