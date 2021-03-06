import * as React from 'react';
import { Helmet } from 'react-helmet';
import {
  message,
  Avatar,
  Button,
  Layout,
  Menu,
  Tabs,
  Typography,
  Popconfirm,
  Modal,
} from 'antd';
import {
  TranslationOutlined,
  UserOutlined,
  InfoCircleOutlined,
  // ReadOutlined,
  BookOutlined,
  // ExperimentOutlined,
  HistoryOutlined,
  GithubOutlined,
} from '@ant-design/icons';

import env from '../../utils/env';
import r from '../../utils/r';
import TabAboutUs from './TabAboutUs';
import TabExperimentalFeature from './TabExperimentalFeature';
import TabNewWords from './TabNewWords';
import TabReadingAid from './TabReadingAid';
import TabSelectionTranslate from './TabSelectionTranslate';
import TabTranslationHistory from './TabTranslationHistory';

import { LoginModal } from '../../components';
import {
  sharedConfigManager,
  ConfigListener,
  Config,
} from '../../utils/config';

import './Options.less';

const { Header, Sider, Content } = Layout;
const { TabPane } = Tabs;
const { Text } = Typography;

const kTabAboutUs: string = 'about_us';
const kTabExperimentalFeature = 'experimental_feature';
const kTabNewWords: string = 'new_words';
const kTabReadingAid: string = 'reading_aid';
const kTabSelectionTranslate = 'selection_translate';
const kTabTranslationHistory = 'translation_history';

class OptionsPage extends React.Component<any, any> implements ConfigListener {
  constructor(props: any, state: any) {
    super(props, state);

    this.state = {
      loggedInUser: null,
      loginModalVisible: false,
      selectedTabKey: kTabSelectionTranslate,
    };
  }

  componentDidMount() {
    sharedConfigManager.addListener(this);

    setTimeout(() => this._init(), 1);
  }

  componentWillUnmount() {
    sharedConfigManager.removeListener(this);
  }

  onConfigChange(newConfig: Config) {
    if (!this.state.loggedInUser && newConfig.loggedInUser) {
      message.success('登录成功');
    }
    // 当令牌过期后点击弹框确认时不显示退出提示
    if (
      this.state.loggedInUser &&
      !this._isTokenExpired() &&
      !newConfig.loggedInUser
    ) {
      message.success('退出成功');
    }

    this.setState({
      loggedInUser: newConfig.loggedInUser,
    });
  }

  async _init() {
    let config = await sharedConfigManager.getConfig();

    this.setState(
      {
        loggedInUser: config.loggedInUser,
      },
      () => this._showTokenExpiredModal()
    );
  }

  _isTokenExpired(): boolean {
    const { loggedInUser } = this.state;
    const { jwtToken } = loggedInUser;
    const nowTimestamp = parseInt((new Date().getTime() / 1000).toString());

    if (jwtToken.expiresIn < nowTimestamp) {
      return true;
    }
    return false;
  }

  async _showTokenExpiredModal() {
    if (this._isTokenExpired()) {
      Modal.error({
        title: '身份验证会话已过期，请重新登录。',
        okText: '确定',
        onOk: () => {
          sharedConfigManager.setLoggedInUser(null);
        },
      });
    }
  }

  _handleClickLogin = () => {
    if (this.state.loggedInUser) return;

    if (!chrome.extension) {
      this.setState({ loginModalVisible: true });
      return;
    }
    const urlSearchParams = new URLSearchParams(
      Object.entries({ extensionId: env.extensionId })
    );
    chrome.tabs.create({
      url: `${env.webURL}/account/login?${urlSearchParams}`,
    });
  };

  _handleClickLogout = () => {
    if (!this.state.loggedInUser) return;

    if (!chrome.extension) {
      sharedConfigManager.setLoggedInUser(null);
      return;
    }

    const urlSearchParams = new URLSearchParams(
      Object.entries({ extensionId: env.extensionId })
    );
    chrome.tabs.create({
      url: `${env.webURL}/account/logout?${urlSearchParams}`,
    });
  };

  render() {
    const { selectedTabKey, loggedInUser, loginModalVisible } = this.state;
    return (
      <>
        <Helmet>
          <title>一路背单词（查词助手）</title>
        </Helmet>
        <div className="page-options">
          <Layout>
            <Header>
              <a href={env.webURL} target="_blank" rel="noopener noreferrer">
                <img
                  src={r('/images/icon128.png')}
                  alt="logo"
                  style={{ width: '24px', marginRight: '8px' }}
                />
                <span>一路背单词（查词助手）</span>
              </a>
              <div style={{ flex: 1 }} />
              <a
                href="https://github.com/wordway/wordway-extension"
                target="_blank"
                rel="noopener noreferrer"
              >
                <GithubOutlined style={{ fontSize: '18px' }} />
              </a>
            </Header>
            <Layout>
              <Sider theme="light" width={220}>
                <div className="user-info" onClick={this._handleClickLogin}>
                  <Avatar
                    size={64}
                    icon={<UserOutlined />}
                    src={loggedInUser?.avatarUrl}
                  />
                  <Text strong>{loggedInUser?.name || '立即登录'}</Text>
                  <Text type="secondary">
                    {loggedInUser?.email || '登录以保持数据同步'}
                  </Text>
                </div>
                <Menu
                  defaultSelectedKeys={[selectedTabKey]}
                  mode="inline"
                  onSelect={({ key }: any) => {
                    this.setState({
                      selectedTabKey: key,
                    });
                  }}
                >
                  <Menu.ItemGroup>
                    <Menu.Item key={kTabSelectionTranslate}>
                      <TranslationOutlined />
                      划词翻译
                    </Menu.Item>
                    {/* <Menu.Item key={kTabReadingAid}>
                      <ReadOutlined />
                      阅读辅助
                    </Menu.Item> */}
                  </Menu.ItemGroup>
                  <Menu.ItemGroup title="您的数据">
                    <Menu.Item key={kTabNewWords}>
                      <HistoryOutlined />
                      生词本
                    </Menu.Item>
                    <Menu.Item key={kTabTranslationHistory}>
                      <BookOutlined />
                      翻译记录
                    </Menu.Item>
                  </Menu.ItemGroup>
                  <Menu.ItemGroup title="其他设置">
                    {/* <Menu.Item key={kTabExperimentalFeature}>
                      <ExperimentOutlined />
                      实验性功能
                    </Menu.Item> */}
                    <Menu.Item key={kTabAboutUs}>
                      <InfoCircleOutlined />
                      关于我们
                    </Menu.Item>
                  </Menu.ItemGroup>
                </Menu>
                {loggedInUser && (
                  <Popconfirm
                    title="确定退出登录吗？"
                    onConfirm={this._handleClickLogout}
                    okText="是"
                    cancelText="否"
                  >
                    <Button
                      type="primary"
                      ghost
                      style={{ width: '120px', marginTop: '100px' }}
                    >
                      退出登录
                    </Button>
                  </Popconfirm>
                )}
              </Sider>
              <Content>
                <Tabs activeKey={selectedTabKey} renderTabBar={() => <div />}>
                  <TabPane key={kTabNewWords}>
                    <TabNewWords
                      visible={selectedTabKey === kTabNewWords}
                      loggedInUser={loggedInUser}
                    />
                  </TabPane>
                  <TabPane key={kTabTranslationHistory}>
                    <TabTranslationHistory
                      visible={selectedTabKey === kTabTranslationHistory}
                    />
                  </TabPane>
                  <TabPane key={kTabSelectionTranslate}>
                    <TabSelectionTranslate />
                  </TabPane>
                  <TabPane key={kTabReadingAid}>
                    <TabReadingAid />
                  </TabPane>
                  <TabPane key={kTabExperimentalFeature}>
                    <TabExperimentalFeature />
                  </TabPane>
                  <TabPane key={kTabAboutUs}>
                    <TabAboutUs />
                  </TabPane>
                </Tabs>
              </Content>
            </Layout>
          </Layout>
          <LoginModal
            visible={loginModalVisible}
            onCancel={() => {
              this.setState({
                loginModalVisible: false,
              });
            }}
            onLoginSuccess={(user) => {
              this.setState({
                loginModalVisible: false,
              });

              sharedConfigManager.setLoggedInUser(user);
            }}
          />
        </div>
      </>
    );
  }
}

export default OptionsPage;
