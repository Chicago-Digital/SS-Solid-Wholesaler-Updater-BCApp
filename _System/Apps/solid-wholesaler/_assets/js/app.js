//global vars
var _appKey = "solid-wholesaler";
var _mainAppFolderLoc = '/_System/apps/'+_appKey+'/';
var _mainAppFolder = new BCAPI.Models.FileSystem.Folder(_mainAppFolderLoc); 
var currentPage = 1;
$(document).ready(function(){
	 
// tabs	
var currentPage = window.location.pathname.split(_appKey+'/')[1];
$('a[href^="'+currentPage+'"]').parent().addClass('active');

$(function(){
	
     $('#delete-app').click(function() {
		var prompt = window.prompt('To confirm type DELETE');
		if (prompt === 'DELETE') {
			_mainAppFolder.destroy().done(function() {
				window.top.location.href = BCAPI.Helper.Site.getRootUrl();
			});
		} else if (prompt !== null) {
			window.alert('You must type \'DELETE\' (case sensitive) to proceed.');
		}
	 });
	 $( document ).ajaxStop(function() {
		  $('.pagination').click(function() {
				 $(".itemList").html("");
				 var numToSkip = (parseInt($(this).text())-1)*500+1;
				 getCustomers($(".customerTypeSelect").val(),numToSkip);
			 })
	});
	 
	 
	 $('.addWholesaler').click(function() {
		 updateCustomers(true);
	 })
	 
	 $('.removeWholesaler').click(function() {
		 updateCustomers(false);
	 })
	 
	 $(".customerTypeSelect").change(function() {
		  $(".itemList").html("");
		  var numToSkip = 0;
		  getCustomers($(".customerTypeSelect").val(),numToSkip)
		});
	$('.selectAll').click(function() {
	  var checkedStatus = this.checked;
	  $('.action').find(':checkbox').each(function() {
		$(this).prop('checked', checkedStatus);
	  });
	});
	
});
var access_token = BCAPI.Helper.Site.getAccessToken();
var siteURL = "";
var request = $.ajax({
    "url": "/api/v2/admin/sites/current",
    "headers": {
        "Authorization": $.cookie('access_token')
    },
    "contentType": "application/json"
})
	request.done(function (msg) {
		siteURL = msg.siteLinks[2].uri.substring(0, msg.siteLinks[2].uri.length - 1);
		getCustomerTypes();
		getCustomers();
	});

	function updateCustomers(isWholesaler){
		numCustomerstoUpdate = $('.action :checked').length; 
		$('.action :checked').each(function(i) {
			currentCustomerID = $(this).val();
       		var request = $.ajax({
			url: "/webresources/api/v3/sites/current/customers/"+currentCustomerID,
			type: "PUT",
			connection: "keep-alive",    
			contentType: "application/json",
			mimeType: "application/json ",
			headers: {
				"Authorization": $.cookie('access_token')
			},
			processData: false,
			data: JSON.stringify({
				"wholesaler": isWholesaler
			})
			});
			request.done(function(msg) {
				if (i == 0){
					$(".RadGrid_Default").hide();
					$(".itemList").html("");
					$(".updatingMessage").show();
				}
				else if (i == (numCustomerstoUpdate-1))
				{
					$(".updatingMessage").hide();
			  		$(".RadGrid_Default").show();
					var numToSkip = (parseInt(currentPage)-1)*500+1;
					setTimeout(getCustomers($(".customerTypeSelect").val(),numToSkip), 2000);
				}
			})
			request.fail(function(jqXHR) {
			console.log("Request failed.");
			console.log("Error code: " + jqXHR.status);
			console.log("Error text: " + jqXHR.statusText);
			console.log("Response text: " + jqXHR.responseText);
			})
     	});
		
	}
	function getCustomers(chosenCustomerType,skip)
	{
		var customerFilter = "";
		if (chosenCustomerType && chosenCustomerType != "") customerFilter = "&where={'customerTypeId':'"+chosenCustomerType+"'}";
		var skipFilter = "";
		if (skip && skip > 1) skipFilter = "&skip="+skip;
		 var customers_request = $.ajax({
			url: "/webresources/api/v3/sites/current/customers?limit=500&order=lastName&fields=id,firstName,lastName,wholesaler"+customerFilter+skipFilter,
			type: "GET",
			connection: "keep-alive",    
			contentType: "application/json",
			mimeType: "application/json ",
			headers: {"Authorization": $.cookie('access_token')}
		});
		
		customers_request.done(function (msg) {
			var numPages = Math.ceil(msg.totalItemsCount/500);
			currentPage = 1;
			if (skip) currentPage = Math.ceil(skip/500);
			$('.rgInfoPart').html("Displaying Page "+currentPage+" of "+numPages+" | Total Contacts: "+msg.totalItemsCount);
			$('.rgPagerCell').html("");
			for (var z = 1; z <= numPages; z++)
			{
				$('.rgPagerCell').append("<a href='#' class='pagination'>"+z+"</a>")
			}
			for (var i = 0; i < msg.items.length; i++)
			{
				var customer = msg.items[i];
				var rowStyle = "rgRow";
				if (i%2 != 0) rowStyle = "rgAltRow";
				//if (customer.wholesaler) customer.wholesaler = "checked='checked'";
				//else customer.wholesaler = "";
				$('.itemList').append("<tr class='"+rowStyle+"' id='customer-"+customer.id+"'><td class='action'><input type='checkbox' name='wholesaler' value='"+customer.id+"'></td><td class='customerName'>"+customer.firstName+" "+customer.lastName+"</td><td class='customerID'>"+customer.id+"</td><td class='customerWholesaler'>"+customer.wholesaler+"</td></tr>");
			}
		})
	}
	
	function getCustomerTypes()
	{
		var request = $.ajax({
			url: "/webresources/api/v3/sites/current/customertypes?limit=500",
			type: "GET",
			connection: "keep-alive",    
			contentType: "application/json",
			mimeType: "application/json ",
			headers: {
				"Authorization": $.cookie('access_token')
			}
		});
		request.done(function (msg) {
			for (var i = 0; i < msg.items.length; i++)
			{
				var customerType = msg.items[i];
			$('.customerTypeSelect').append("<option value='"+customerType.id+"'>"+customerType.label+"</option>");
			}
		})
		
	}
});