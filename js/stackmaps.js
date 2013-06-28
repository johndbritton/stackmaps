$(document).ready(function(){

  // Resize map with window changes
  $(window).resize(function(){
    $('#map').height(
      $(window).height() - $('#header').outerHeight() -20
    );
  });
  $( window ).resize();

  // Declare constants
  var PAGE_SIZE = 100;
  var BATCH_SIZE = 5;

  // Set up storage
  var sites = [];
  var markers = [];
  var page = 1;
  var more = true;
  var site;

  // Set up the map
  var mti = google.maps.MapTypeId;
  var mapOptions = {
    zoom: 2,
    center: new google.maps.LatLng(0, 0),
    panControl: false,
    mapTypeId: google.maps.MapTypeId.TERRAIN
  };
  var map = new google.maps.Map(document.getElementById("map"), mapOptions);

  // Set up the infowindow
  var infowindow = new google.maps.InfoWindow();
  google.maps.event.addListener(map, "click", function(){
    infowindow.close();
  });

  // Handle markers in the same place
  var omsOptions = {
    keepSpiderfied: true,
    markersWontMove: true,
  };
  var oms = new OverlappingMarkerSpiderfier(map, omsOptions);
  oms.legColors.highlighted[mti.HYBRID] = oms.legColors.highlighted[mti.SATELLITE] = 
  oms.legColors.highlighted[mti.TERRAIN] = oms.legColors.highlighted[mti.ROADMAP] = '#07C';

  oms.addListener('click', function(marker) {
    updateInfoWindow(marker);
    infowindow.open(map, marker);
  });

  // Set up site select
  $('.chzn-select').chosen();

  // Remove markers, reset state
  function resetMap() {
    oms.clearMarkers();
    $.each(markers, function(i, marker) {
      marker.setMap(null);
      marker = null;
    });
    markers = [];
    more = true;
    $('#more').attr('disabled', false).html('show more users');
  }

  function getUsers() {
    $('#more').attr('disabled', true).html('fetching users');
    $.ajax({
      url: 'http://api.stackexchange.com/2.0/users',
      type: 'GET',
      dataType: 'json',
      data: 'order=desc&sort=reputation&page=' + page + '&pagesize=' + PAGE_SIZE + '&site=' + site.api_site_parameter,
      success: function(data) {
        more = data.has_more;
        $.each(data.items, function(i, user) {
          geocodeUser(user);
        });
        if(more) {
          page++;
          if(page % BATCH_SIZE){
            getUsers();
          } else {
            $('#more').attr('disabled', false).html('show more users');
          }
        } else {
          $('#more').attr('disabled', true).html('showing all users');
        }
      }
    });
  }

  function geocodeUser(user) {
    $.ajax({
      url: 'http://maps.googleapis.com/maps/api/geocode/json',
      type: 'GET',
      data: 'sensor=false&address=' + user.location,
      dataType: 'json',
      success: function(data) {
        place = data.results[0];
        if(place) {
          var geom = place.geometry;
          var marker = new google.maps.Marker({
            map: map,
            position: new google.maps.LatLng(geom.location.lat, geom.location.lng),
            title: user.display_name,
            user: user,
          });
          markers.push(marker);
          oms.addMarker(marker);
        }
      }
    });
  }

  function updateInfoWindow(marker) {
    infowindow.setContent(
      '<div id="user">' +
        '<img id="avatar" src="' + marker.user.profile_image + '"></img>' +
        '<span id="name"><a href="'+ marker.user.link +'" target="_blank">' + marker.user.display_name + '</a></span><br>' +
        '<span id="reputation">' + marker.user.reputation + '</span>' +
        '<span id="badges">' + 
          '<span id="gold">' + marker.user.badge_counts.gold + '</span>' +
          '<span id="silver">' + marker.user.badge_counts.silver + '</span>' +
          '<span id="bronze">' + marker.user.badge_counts.bronze + '</span>' +
        '</span><br>' +
        '<span id="accept-rate">' + (marker.user.accept_rate || 'NA') + '% accept rate</span><br>' +
        '<span id="location">' + marker.user.location + '</span>' +
      '</div>'
    );
    infowindow.open(map, marker);
  }

  // Get sites
  $.ajax({
    url: 'http://api.stackexchange.com/2.0/sites',
    type: 'GET',
    data: 'pagesize=10000',
    dataType: 'json',
    success: function(data) {
      sites = data.items;
      $.each(sites, function(i, site) {
        $('#sites').append('<option value="' + i + '" style="background-image: ' + site.favicon_url + ';">' + site.name + '</option>');
      });
      $('#sites').trigger('liszt:updated');
    }
  });

  // Respond to site selection
  $('#sites').change(function() {
    $('#more').css('display', 'inline');
    $('#sites option:selected').each(function () {
      resetMap();
      site = sites[$(this).attr("value")];
      $('#site-icon').html('<img src="' + site.icon_url + '"></img>');
      getUsers();
    });
  });

  // Show more users upon request
  $('#more').click(function() {
    getUsers();
  });

  // Show info window
  $('#show-info').click(function (event) {
    event.preventDefault();
    $('#info').css('visibility','visible');
  });

  // Hide info window
  $('#info').click(function (event) {
     if (event.target !== this) {return;}
    $('#info').css('visibility','hidden');
  });
});

