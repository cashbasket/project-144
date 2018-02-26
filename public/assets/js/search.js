$(document).ready(function() {
	if($('#type').val() === 'album') 
		$('#query').attr('placeholder', 'e.g. "Number of the Beast"');
	else
		$('#query').attr('placeholder', 'e.g. "Iron Maiden"');
	$('#type').on('change', function(event) {
		if ($(this).val() === 'album') {
			$('#searchTypeText').text('album title');
			$('#query').attr('placeholder', 'e.g. "Number of the Beast"');
		} else {
			$('#searchTypeText').text('artist name');
			$('#query').attr('placeholder', 'e.g. "Iron Maiden"');
		}
	});
});