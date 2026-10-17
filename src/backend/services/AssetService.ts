import { AssetModel } from '../models/AssetModel';
import { UserModel } from '../models/UserModel';
import { NotificationModel } from '../models/NotificationModel';
import { PaymentModel } from '../models/PaymentModel';
import { Asset, PaymentTransaction } from '../../types';

export class AssetService {
  static async requestAsset(assetId: string, userId: string, details: string): Promise<Asset> {
    const asset = AssetModel.findById(assetId);
    if (!asset) throw new Error('Thiết bị không tồn tại.');

    const user = await UserModel.findById(userId);
    if (!user) throw new Error('Nhân viên không tồn tại.');

    if (asset.status !== 'available') {
      throw new Error('Thiết bị này hiện không sẵn có để bàn giao.');
    }

    AssetModel.update(assetId, {
      status: 'pending_assign',
      requestedBy: userId,
      requestDetails: details
    });

    // Notify Admins
    const admins = (await UserModel.findAll()).filter(u => u.role === 'admin');
    admins.forEach(admin => {
      NotificationModel.create({
        id: 'notif-' + Math.random().toString(36).substring(2, 11),
        userId: admin.id,
        title: 'Yêu cầu cấp thiết bị',
        message: `Nhân viên ${user.name} (${user.department}) yêu cầu cấp phát thiết bị: ${asset.name}.`,
        read: false,
        type: 'asset',
        link: '/admin/assets',
        timestamp: new Date().toISOString()
      });
    });

    return { ...asset, status: 'pending_assign', requestedBy: userId, requestDetails: details };
  }

  static async requestReturn(assetId: string, userId: string, details: string, reportedDamagePercent: number): Promise<Asset> {
    const asset = AssetModel.findById(assetId);
    if (!asset) throw new Error('Thiết bị không tồn tại.');

    if (asset.assignedTo !== userId) {
      throw new Error('Bạn không sở hữu thiết bị này để yêu cầu thu hồi.');
    }

    AssetModel.update(assetId, {
      status: 'pending_return',
      requestedBy: userId,
      requestDetails: `Báo cáo hao mòn/hỏng hóc: ${reportedDamagePercent}%. Ghi chú: ${details}`,
      returnCondition: reportedDamagePercent
    });

    // Notify Admins
    const admins = (await UserModel.findAll()).filter(u => u.role === 'admin');
    admins.forEach(admin => {
      NotificationModel.create({
        id: 'notif-' + Math.random().toString(36).substring(2, 11),
        userId: admin.id,
        title: 'Yêu cầu trả thiết bị',
        message: `Nhân viên ${asset.assignedToName} yêu cầu bàn giao lại ${asset.name}. Mức hỏng hóc báo cáo: ${reportedDamagePercent}%.`,
        read: false,
        type: 'asset',
        link: '/admin/assets',
        timestamp: new Date().toISOString()
      });
    });

    return { 
      ...asset, 
      status: 'pending_return', 
      requestedBy: userId, 
      requestDetails: details, 
      returnCondition: reportedDamagePercent 
    };
  }

  static async requestExchange(assetId: string, userId: string, details: string): Promise<Asset> {
    const asset = AssetModel.findById(assetId);
    if (!asset) throw new Error('Thiết bị không tồn tại.');

    if (asset.assignedTo !== userId) {
      throw new Error('Bạn không sở hữu thiết bị này để yêu cầu đổi.');
    }

    AssetModel.update(assetId, {
      status: 'pending_exchange',
      requestedBy: userId,
      requestDetails: details
    });

    // Notify Admins
    const admins = (await UserModel.findAll()).filter(u => u.role === 'admin');
    admins.forEach(admin => {
      NotificationModel.create({
        id: 'notif-' + Math.random().toString(36).substring(2, 11),
        userId: admin.id,
        title: 'Yêu cầu đổi thiết bị',
        message: `Nhân viên ${asset.assignedToName} yêu cầu đổi thiết bị ${asset.name}. Lý do: ${details}`,
        read: false,
        type: 'asset',
        link: '/admin/assets',
        timestamp: new Date().toISOString()
      });
    });

    return { ...asset, status: 'pending_exchange', requestedBy: userId, requestDetails: details };
  }

  static async requestBuyback(assetId: string, userId: string, details: string): Promise<Asset> {
    const asset = AssetModel.findById(assetId);
    if (!asset) throw new Error('Thiết bị không tồn tại.');

    if (asset.assignedTo !== userId) {
      throw new Error('Bạn không sở hữu thiết bị này để đăng ký mua thanh lý.');
    }

    AssetModel.update(assetId, {
      status: 'pending_buyback',
      requestedBy: userId,
      requestDetails: details
    });

    // Notify Admins & Finance managers
    const approvers = (await UserModel.findAll()).filter(u => u.role === 'admin' || (u.role === 'manager' && u.department === 'Finance'));
    approvers.forEach(app => {
      NotificationModel.create({
        id: 'notif-' + Math.random().toString(36).substring(2, 11),
        userId: app.id,
        title: 'Yêu cầu mua thanh lý máy móc',
        message: `Nhân viên ${asset.assignedToName} muốn mua thanh lý lại thiết bị ${asset.name} với giá đề xuất ${asset.currentPriceForSale.toLocaleString('vi-VN')}đ.`,
        read: false,
        type: 'asset',
        link: '/admin/assets',
        timestamp: new Date().toISOString()
      });
    });

    return { ...asset, status: 'pending_buyback', requestedBy: userId, requestDetails: details };
  }

  static async approveAssetRequest(
    assetId: string, 
    action: 'assign' | 'return' | 'exchange' | 'buyback', 
    reviewerId: string, 
    paymentMethod?: 'credit_card' | 'e_wallet' | 'payroll_deduction'
  ): Promise<Asset> {
    const asset = AssetModel.findById(assetId);
    if (!asset) throw new Error('Thiết bị không tồn tại.');

    const reviewer = await UserModel.findById(reviewerId);
    if (!reviewer || reviewer.role !== 'admin') {
      // Check if it is a finance manager for buyback
      const isFinanceMgr = reviewer && reviewer.role === 'manager' && reviewer.department === 'Finance';
      if (!isFinanceMgr) {
        throw new Error('Bạn không có quyền duyệt các thao tác này.');
      }
    }

    const requesterId = asset.requestedBy;
    if (!requesterId) throw new Error('Không tìm thấy thông tin người yêu cầu.');

    const user = await UserModel.findById(requesterId);
    if (!user) throw new Error('Nhân viên yêu cầu không tồn tại.');

    let updateData: Partial<Asset> = {};

    if (action === 'assign') {
      updateData = {
        status: 'assigned',
        assignedTo: requesterId,
        assignedToName: user.name,
        assignmentDate: new Date().toISOString(),
        requestedBy: undefined,
        requestDetails: undefined
      };

      NotificationModel.create({
        id: 'notif-' + Math.random().toString(36).substring(2, 11),
        userId: requesterId,
        title: 'Yêu cầu cấp phát được duyệt',
        message: `Yêu cầu cấp phát thiết bị ${asset.name} của bạn đã được Admin phê duyệt. Vui lòng nhận bàn giao từ IT.`,
        read: false,
        type: 'asset',
        timestamp: new Date().toISOString()
      });
    } 
    else if (action === 'return') {
      const finalDamage = asset.returnCondition !== undefined ? asset.returnCondition : asset.currentCondition;
      updateData = {
        status: 'available',
        assignedTo: undefined,
        assignedToName: undefined,
        assignmentDate: undefined,
        currentCondition: finalDamage,
        returnCondition: undefined,
        requestedBy: undefined,
        requestDetails: undefined
      };

      NotificationModel.create({
        id: 'notif-' + Math.random().toString(36).substring(2, 11),
        userId: requesterId,
        title: 'Thu hồi thiết bị hoàn tất',
        message: `Thiết bị ${asset.name} đã được thu hồi và hoàn trả thành công về kho. Hao mòn ghi nhận: ${finalDamage}%.`,
        read: false,
        type: 'asset',
        timestamp: new Date().toISOString()
      });
    } 
    else if (action === 'exchange') {
      // Free current asset
      updateData = {
        status: 'available',
        assignedTo: undefined,
        assignedToName: undefined,
        assignmentDate: undefined,
        requestedBy: undefined,
        requestDetails: undefined
      };

      NotificationModel.create({
        id: 'notif-' + Math.random().toString(36).substring(2, 11),
        userId: requesterId,
        title: 'Chấp thuận đổi thiết bị',
        message: `Yêu cầu đổi thiết bị ${asset.name} của bạn đã được chấp thuận. Vui lòng hoàn trả máy cũ và đăng ký mẫu thiết bị mới.`,
        read: false,
        type: 'asset',
        timestamp: new Date().toISOString()
      });
    } 
    else if (action === 'buyback') {
      if (!paymentMethod) {
        throw new Error('Vui lòng chọn hình thức thanh toán khi mua thanh lý.');
      }

      // Complete purchase transaction
      const transId = 'trans-' + Math.random().toString(36).substring(2, 11);
      const transaction: PaymentTransaction = {
        id: transId,
        userId: user.id,
        userName: user.name,
        assetId: asset.id,
        assetName: asset.name,
        type: 'buyback',
        amount: asset.currentPriceForSale,
        paymentMethod,
        status: 'completed',
        timestamp: new Date().toISOString()
      };

      PaymentModel.create(transaction);

      updateData = {
        status: 'sold',
        requestedBy: undefined,
        requestDetails: undefined
      };

      // If payroll deduction, update a notification warning or logging the deduction
      let messageSuffix = '';
      if (paymentMethod === 'payroll_deduction') {
        messageSuffix = ` Số tiền ${asset.currentPriceForSale.toLocaleString('vi-VN')}đ sẽ được khấu trừ trực tiếp vào kỳ lương tới của bạn.`;
        // Optionally adjust salary record for display
      } else if (paymentMethod === 'credit_card') {
        messageSuffix = ` Đã thanh toán thành công qua Thẻ tín dụng liên kết.`;
      } else {
        messageSuffix = ` Đã nhận thanh toán thành công qua Ví điện tử MoMo/ZaloPay.`;
      }

      NotificationModel.create({
        id: 'notif-' + Math.random().toString(36).substring(2, 11),
        userId: requesterId,
        title: 'Hóa đơn sở hữu thiết bị',
        message: `Chúc mừng bạn đã sở hữu thiết bị ${asset.name} thanh lý thành công!${messageSuffix}`,
        read: false,
        type: 'payment',
        timestamp: new Date().toISOString()
      });
    }

    AssetModel.update(assetId, updateData);
    return { ...asset, ...updateData };
  }

  static async rejectAssetRequest(assetId: string, reviewerId: string, comment: string): Promise<Asset> {
    const asset = AssetModel.findById(assetId);
    if (!asset) throw new Error('Thiết bị không tồn tại.');

    const reviewer = await UserModel.findById(reviewerId);
    if (!reviewer || reviewer.role !== 'admin') {
      const isFinance = reviewer && reviewer.role === 'manager' && reviewer.department === 'Finance';
      if (!isFinance) throw new Error('Bạn không có quyền từ chối yêu cầu này.');
    }

    const requesterId = asset.requestedBy;
    if (!requesterId) throw new Error('Không có yêu cầu đang hoạt động.');

    let originalStatus: Asset['status'] = 'available';
    if (asset.status === 'pending_assign') {
      originalStatus = 'available';
    } else {
      originalStatus = 'assigned'; // returns, exchanges, buybacks are from assigned states
    }

    AssetModel.update(assetId, {
      status: originalStatus,
      requestedBy: undefined,
      requestDetails: undefined,
      returnCondition: undefined
    });

    NotificationModel.create({
      id: 'notif-' + Math.random().toString(36).substring(2, 11),
      userId: requesterId,
      title: 'Yêu cầu thiết bị bị TỪ CHỐI',
      message: `Yêu cầu liên quan đến thiết bị "${asset.name}" đã bị từ chối bởi ${reviewer.name}. Lý do: "${comment}"`,
      read: false,
      type: 'asset',
      timestamp: new Date().toISOString()
    });

    return { 
      ...asset, 
      status: originalStatus, 
      requestedBy: undefined, 
      requestDetails: undefined, 
      returnCondition: undefined 
    };
  }
}
