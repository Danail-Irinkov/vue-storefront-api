FROM docker.elastic.co/elasticsearch/elasticsearch:5.6.11

RUN bin/elasticsearch-plugin remove x-pack --purge

EXPOSE 9200

# Add your elasticsearch plugins setup here
# Example: RUN elasticsearch-plugin install analysis-icu
