import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { Link, Redirect, Route, Switch } from 'react-router-dom';
import { AddButton, Channels, Chats, Header, LogOutButton, MenuScroll, ProfileImg, ProfileModal, RightMenu, WorkspaceButton, WorkspaceModal, WorkspaceName, Workspaces, WorkspaceWrapper } from './styles';
import Menu from '@components/Menu';
import Modal from '@components/Modal';
import Channel from '@pages/Channel';
import DirectMessage from '@pages/DirectMessage';
import CreateChannelModal from '@components/CreateChannelModal';
import gravartar from 'gravatar';
import fetcher from '@utils/fetcher';
import { Button, Input, Label } from '@pages/SignUp/styles';
import { toast, ToastContainer } from 'react-toastify';
import { useParams } from 'react-router';
import useInput from '@hooks/useInput';
import useSWR from 'swr';
import InviteWorkspaceModal from '@components/InviteWorkspaceModal';
import InviteChannelModal from '@components/InviteChannelModal';
import DMList from '@components/DMList';
import ChannelList from '@components/ChannelList';
import useSocket from '@hooks/useSocket';


const Workspace = () => {
    const { workspace, channel } = useParams();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showCreateWorkspaceModal, setShowCreateWorkspaceModal] = useState(false);
    const [showInviteWorkspaceModal, setShowInviteWorkspaceModal] = useState(false);
    const [showInviteChannelModal, setShowInviteChannelModal] = useState(false);
    const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
    const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
    const [newWorkspace, onChangeNewWorkspace, setNewWorkspace] = useInput('');
    const [newUrl, onChangeNewUrl, setNewUrl] = useInput('');

    const { data: userData, error: loginError, mutate: revalidateUser } = useSWR('/api/users', fetcher);
    const { data: channelData } = useSWR(userData ? `/api/workspaces/${workspace}/channels` : null, fetcher);
    const { data: memberData } = useSWR(userData ? `/api/workspaces/${workspace}/members` : null, fetcher);
    const [socket, disconnect] = useSocket(workspace);

    useEffect(() => {
        if (channelData && userData && socket) {
            socket?.emit('login', { id: userData.id, channels: channelData.map((v) => v.id)});
        }
    }, [socket, channelData, userData]);

    useEffect(() => {
        return () => {
            disconnect();
        }
    }, [workspace, disconnect]);

    const onLogoutHandler = useCallback(() => {
        axios
          .post('/api/users/logout')
          .then(() => {
            revalidateUser();
          })
          .catch((error) => {
            console.dir(error);
            toast.error(error.response?.data, { position: 'bottom-center' });
          });
    }, [revalidateUser]);

    //토글 함수
    const onClickUserProfile = useCallback((e) => {
        e.stopPropagation();
        setShowUserMenu((prev) => !prev);
    }, []);

    const onClickCreateWorkspace = useCallback(() => {
        setShowCreateWorkspaceModal(true);
    });

    const toggleWorkspaceModal = useCallback(() => {
        setShowWorkspaceModal((prev) => !prev);
    }, []); 

    const onClickInviteWorkspace = useCallback(() => {
        setShowInviteWorkspaceModal(true);
    }, []);

    const onCreateWorkspace = useCallback((e) => {
        e.preventDefault();
        if (!newWorkspace || !newWorkspace.trim()) return;
        if (!newUrl || !newUrl.trim()) return;
        axios.post('/api/workspaces', {
            workspace: newWorkspace,
            url: newUrl,
        }).then(() => {
            revalidateUser();
            setShowCreateWorkspaceModal(false);
            setNewWorkspace('');
            setNewUrl('');
        }).catch((err) => {
            console.dir(err);
        })
    }, [newWorkspace, newUrl]);

    const onCloseModal = useCallback(() => {
        setShowCreateWorkspaceModal(false);
        setShowCreateChannelModal(false);
        setShowInviteWorkspaceModal(false);
        setShowInviteChannelModal(false);
      }, []);

    const onClickAddChannel = useCallback(() => {
        setShowCreateChannelModal(true);
    }, []);

    if (loginError) {
        return <Redirect to="/login" />;
    }

    return (
        <div>
            <Header>
                <RightMenu>
                    <span onClick={onClickUserProfile}>
                        <ProfileImg src={gravartar.url(userData.email, { s: "28px", d: "retro"})} alt={userData.nickname} />
                    </span>
                    {showUserMenu &&
                        <Menu style={{right: 0, top:38}} show={showUserMenu} onCloseModal={onClickUserProfile}>
                            <ProfileModal>
                                <img scr={gravartar.url(userData.email, {s:"36px", d:"radio"})} alt={userData.nickname} />
                                <div>
                                    <span id="profile-name">{userData.nickname}</span>
                                    <span id="profile-active">Active</span>
                                </div>
                            </ProfileModal>
                            <LogOutButton onClick={onLogoutHandler}>로그아웃</LogOutButton>
                        </Menu>}
                </RightMenu>
            </Header>
            <WorkspaceWrapper>
                <Workspaces>
                    {userData?.Workspaces.map((ws) => {
                        console.log("map" + ws)
                        return (
                            <Link key={ws.id} to={`/workspace/${ws.url}/channel/일반`}>
                                <WorkspaceButton>{ws.name.slice(0,1).toUpperCase()}</WorkspaceButton>
                            </Link>
                        );
                    })}
                    <AddButton onClick={onClickCreateWorkspace}>+</AddButton>
                </Workspaces>
                <Channels>
                    <WorkspaceName onClick={toggleWorkspaceModal}>
                        Sleact
                    </WorkspaceName>
                    <MenuScroll>
                        <Menu show={showWorkspaceModal} onCloseModal={toggleWorkspaceModal} style={{top:95, left:80}}>
                            <WorkspaceModal>
                                <h2>sleact</h2>
                                <button onClick={onClickInviteWorkspace}>워크스페이스에 사용자 초대</button>
                                <button onClick={onClickAddChannel}>채널 만들기</button>
                                <button onClick={onLogoutHandler}>로그아웃</button>
                            </WorkspaceModal>
                        </Menu>
                        <ChannelList />
                        <DMList />
                    </MenuScroll>
                </Channels>
                <Chats>
                    <Switch>
                        <Route path="/workspace/:workspace/channel/:channel" component={Channel} />
                        <Route path="/workspace/:workspace/dm/:id" component={DirectMessage} />
                    </Switch>
                </Chats>
            </WorkspaceWrapper>
            <Modal show={showCreateWorkspaceModal} onCloseModal={onCloseModal}>
                <form onSubmit={onCreateWorkspace}>
                    <Label id='workspace-label'>
                        <span>워크스페이스 이름</span>
                        <Input id="workspace" value={newWorkspace} onChange={onChangeNewWorkspace}></Input>
                    </Label>
                    <Label id='workspace-url-label'>
                        <span>워크스페이스 url</span>
                        <Input id="workspace" value={newUrl} onChange={onChangeNewUrl}></Input>
                    </Label>
                    <Button type="submit">생성하기</Button>
                </form>
            </Modal>
            <CreateChannelModal
                show={showCreateChannelModal}
                onCloseModal={onCloseModal}
                setShowCreateChannelModal={setShowCreateChannelModal} />
            <InviteWorkspaceModal
                show={showInviteWorkspaceModal}
                onCloseModal={onCloseModal}
                setShowInviteWorkspaceModal={setShowInviteWorkspaceModal} />
            <InviteChannelModal
                show={showInviteChannelModal}
                onCloseModal={onCloseModal}
                setShowInviteChannelModal={setShowInviteChannelModal} />
        </div>
    );
};

export default Workspace;