import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Header from './Header';
import { useAuth } from '../contexts/AuthContext';
import './MessagesPage.css';

function MessagesPage() {
    const { currentUser } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const API_URL = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const response = await axios.get(`${API_URL}/conversations`, { withCredentials: true });
                setConversations(response.data);

                const thumbnails = response.data.map(convo => convo.listing.thumbnail);
                const presignedResponse = await axios.post(`${API_URL}/generatePresignedUrls`, { thumbnails });

                const updatedConversations = response.data.map(convo => {
                    const presignedThumbnail = presignedResponse.data.find(p => p.originalUrl === convo.listing.thumbnail);
                    return { ...convo, listing: { ...convo.listing, thumbnailUrl: presignedThumbnail.presignedUrl } };
                });

                setConversations(updatedConversations);
            } catch (error) {
                console.error('Error fetching conversations:', error);
            }
        };

        fetchConversations();
    }, []);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);

        const isToday = date.toDateString() === today.toDateString();
        const isYesterday = date.toDateString() === yesterday.toDateString();

        if (isToday) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Los_Angeles' });
        } else if (isYesterday) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' });
        }
    };

    function timeAgo(date) {
        const now = new Date();
        const secondsAgo = Math.floor((now - new Date(date)) / 1000);
    
        const minutes = Math.floor(secondsAgo / 60);
        if (minutes < 1) return "0 minutes ago";
        if (minutes === 1) return "1 minute ago";
        if (minutes < 60) return `${minutes} minutes ago`;
    
        const hours = Math.floor(minutes / 60);
        if (hours === 1) return "1 hour ago";
        if (hours < 24) return `${hours} hours ago`;
    
        const days = Math.floor(hours / 24);
        if (days <= 1) return "1 day ago";
        if (days < 7) return `${days} days ago`;
    
        const weeks = Math.floor(days / 7);
        if (weeks <= 1) return "1 week ago";
        if (weeks < 4) return `${weeks} weeks ago`;
    
        const months = Math.floor(days / 30);
        if (months <= 1) return "1 month ago";
        if (months < 12) return `${months} months ago`;
    
        const years = Math.floor(days / 365);
        if (years <= 1) return "1 year ago";
        else {return `${years} years ago`};
    }  

    const sendMessage = async () => {
        if (!newMessage.trim() || !selectedConversation) return;

        try {
            const response = await axios.post(`${API_URL}/sendMessage`, {
                content: newMessage,
                listingId: selectedConversation.listing._id,
                recipientId: selectedConversation.participants.find(p => p._id !== currentUser._id)._id,
            }, { withCredentials: true });

            const updatedConversation = await axios.get(`${API_URL}/conversations/${response.data.conversation._id}`, { withCredentials: true });
            setSelectedConversation(updatedConversation.data);
            setNewMessage("");
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    return (
    <div>
        <div className="messages-page">
            <Header />
            <div className="conversations-wrapper">
                <div className="conversations-list">
                    {conversations.map(conversation => {
                        const lastMessage = conversation.messages[conversation.messages.length - 1]; // Get the last message
                        const lastMessageTime = lastMessage ? lastMessage.timestamp : null;

                        return (
                            <div
                                key={conversation._id}
                                className={`conversation-item ${selectedConversation && selectedConversation._id === conversation._id ? 'selected' : ''}`}
                                onClick={async () => {
                                    const updatedConversation = await axios.get(`${API_URL}/conversations/${conversation._id}`, { withCredentials: true });
                                    setSelectedConversation(updatedConversation.data);
                                }}
                            >
                                
                                <img src={conversation.listing.thumbnailUrl} className="small-img" alt="Listing thumbnail" />
                            
                                <div className="conversation-info">
                                    <div className="conversation-listing-name">
                                        {conversation.listing.name}
                                    </div>
                                    <div className="last-message-time">
                                        {lastMessageTime ? timeAgo(lastMessageTime) : "No messages yet"}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
                {selectedConversation && (
                    <div className="conversation-container">
                        <div className="conversation-header">
                            <h2>{selectedConversation.listing.name}</h2>
                        </div>
                        <div className="messages">
                            {selectedConversation.messages.map((message, index) => {
                                const previousMessage = selectedConversation.messages[index - 1];
                                const showDate = !previousMessage || new Date(message.timestamp).toDateString() !== new Date(previousMessage.timestamp).toDateString();
                                
                                return (
                                    <div key={message._id} className="message-wrapper">
                                        <div className={`message-item ${message.sender._id === currentUser._id ? 'sent' : 'received'}`}>
                                            <strong>{message.sender.username}</strong>: {message.content}
                                        </div>
                                        <div className="message-timestamp">
                                            {showDate
                                                ? formatDate(message.timestamp)
                                                : new Date(message.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Los_Angeles' })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="new-message-container">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="new-message-input"
                            />
                            <button onClick={sendMessage} className="send-message-button">Reply</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
    );
}

export default MessagesPage;
