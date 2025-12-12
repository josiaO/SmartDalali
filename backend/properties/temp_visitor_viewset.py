
class PropertyVisitViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling property visits.
    Users can request/cancel visits.
    Agents can accept/decline visits.
    """
    serializer_class = PropertyVisitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return PropertyVisit.objects.all()
        # Return visits where user is requester OR agent
        return PropertyVisit.objects.filter(Q(user=user) | Q(agent=user)).select_related('property', 'user', 'agent')

    def perform_create(self, serializer):
        # Auto-set the user to current user
        serializer.save(user=self.request.user)
        # TODO: Send notification to agent

    @action(detail=True, methods=['post'])
    def status(self, request, pk=None):
        """Update visit status (accept/decline/cancel)"""
        visit = self.get_object()
        new_status = request.data.get('status')
        
        if new_status not in ['confirmed', 'cancelled', 'declined', 'completed']:
             return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)

        # Logic for who can do what
        if request.user == visit.agent:
            if new_status in ['confirmed', 'declined', 'completed']:
                visit.status = new_status
                visit.save()
                # TODO: Notify user
                return Response(self.get_serializer(visit).data)
            else:
                return Response({'error': 'Agents cannot perform this action'}, status=status.HTTP_403_FORBIDDEN)
        
        if request.user == visit.user:
            if new_status == 'cancelled':
                visit.status = new_status
                visit.save()
                # TODO: Notify agent
                return Response(self.get_serializer(visit).data)
            else:
                 return Response({'error': 'Users can only cancel visits'}, status=status.HTTP_403_FORBIDDEN)
                 
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
