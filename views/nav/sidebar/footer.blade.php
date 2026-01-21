<script src="https://code.jquery.com/jquery-3.4.1.min.js"></script>
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script> <!-- add new for laboratory-view to show category vise package -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0/dist/js/bootstrap.bundle.min.js"></script>
<script src="{{ asset('assets/lib/chart/chart.min.js') }}"></script>
<script src="{{ asset('assets/lib/easing/easing.min.js') }}"></script>
<script src="{{ asset('assets/lib/waypoints/waypoints.min.js') }}"></script>
<script src="{{ asset('assets/lib/owlcarousel/owl.carousel.min.js') }}"></script>
<script src="{{ asset('assets/lib/tempusdominus/js/moment.min.js') }}"></script>
<script src="{{ asset('assets/lib/tempusdominus/js/moment-timezone.min.js') }}"></script>
<script src="{{ asset('assets/lib/tempusdominus/js/tempusdominus-bootstrap-4.min.js') }}"></script>

<!-- Template Javascript -->
<script src="{{ asset('assets/js/main.js') }}"></script>

<script>
            let typingTimer;
        const typingInterval = 500; // Wait 500ms after the user stops typing

        function submitSearchForm() {
            clearTimeout(typingTimer);
            typingTimer = setTimeout(function() {
                document.getElementById('searchForm').submit();
            }, typingInterval);
        }
</script>